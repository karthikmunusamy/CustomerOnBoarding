

var express = require('express');
var http = require('http');
var brainTree = require('braintree');
var bodyParser = require('body-parser');
var request = require('request');
var queryString = require("querystring")

var app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

var self = this;

var gateway = brainTree.connect({
    environment: brainTree.Environment.Sandbox,
    merchantId: "5zhpcmf7vrg95mzb",
    publicKey: "2krv8s7cnc56mxxb",
    privateKey: "ccedcb5bb380228cc688c8baa2d8cc44"
});
console.log("BrainTree connect success");

var customerId;
var status;

function saveCustomer(req, response, result){

    console.log("OnBoarding Success");
    var resBody = {
        status: "success",
        result: result
    };
    var customerDB = {
        'customer': {
            'bt_customer_id': result.customer.id,
            'payment_method_token': result.customer.paymentMethods[0].token
        },
        'device': {
            'mac_id': req.body.macId,
            'item_id': req.body.itemId,
            'quantity': '1'
        }
    };

    console.log("customerDB = " + JSON.stringify(customerDB));

    request.post({
        headers: {'content-type': 'application/json'},
        url: 'http://10.101.1.180:8080/boat/onboarding/customer',
        body: JSON.stringify(customerDB)
    }, function(err, res, body){
        if(err){
            response.json({
                status: "failed",
                errorCode: "10001",
                errorMessage: "Sorry OnBoarding  Failed"
            });
        }else{
            console.log(JSON.stringify(resBody));
            response.json(resBody);
         }
    });
}

function saveAddress(req, response, result){
    gateway.address.create({
        customerId: result.customer.id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        company: req.body.company,
        streetAddress: req.body.addresses[0].streetAddress,
        extendedAddress: req.body.addresses[0].extendedAddress,
        locality: req.body.addresses[0].locality,
        region: req.body.addresses[0].region,
        postalCode: req.body.addresses[0].postalCode,
        countryCodeAlpha2:'US'
    }, function (err, result) {
        console.log("Address Res = " + JSON.stringify(result))
        if(err){
            response.json({
                status: "failed",
                errorCode: "10001",
                errorMessage: "Sorry OnBoarding  Failed"
            });
        }
    });
}

function customerOnBoard(req, response){
    console.log("Customer OnBoarding Requested");

    console.log(JSON.stringify(req.body));
    
    if(0 === req.body.length){
    	response.json(
        		{
                    status: "failed",
                    errorCode: "10003",
                    errorMessage: "Empty Request"
                }
        )
    }

    gateway.customer.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        company: req.body.company,
        email: req.body.email,
        phone: req.body.phone,
        fax: req.body.fax,
        website: req.body.website,
        paymentMethodNonce: req.body.paymentMethodNonce
    }, function(err, result){
		console.log(JSON.stringify(result));
        if(true === result.success){
            saveAddress(req, response, result);
            saveCustomer(req, response, result);
        }else{
            console.log("OnBoarding Failed");
            response.json({
                status: "failed",
                errorCode: "10001",
                errorMessage: "Sorry OnBoarding Failed"
            });
        }
    });
}

function getCustomer(req, res){
    console.log("Get Address for customer id = " + req.params.customerId);

    gateway.customer.find(req.params.customerId, function(err, customer){
        console.log(JSON.stringify(customer));
        if(!err){
            console.log("Success in finding the customer");
            res.json(customer);
        }else{
            res.json(
                {
                    status: "failed",
                    errorCode: "10002",
                    errorMessage: "Sorry, Not able to find Customer id " + req.params.customerId
                }
            )
        }
    });
}

app.use('/customer/onboard', customerOnBoard);
app.get('/customer/:customerId', getCustomer);

http.createServer(app).listen(8888);
console.log("Server is running");
