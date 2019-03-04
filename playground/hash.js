// const bcrypt = require('bcrypt');

// async function run() {
//    const salt = await bcrypt.genSalt(10);

//    const hashed = await bcrypt.hash('1234', salt);
//    console.log(salt);
//    console.log(hashed);

// }

'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');

var payload = {
   data1 : "data1",
   data2 : "data2"
};


var privateKey = fs.readFileSync('./private.key');
var publicKey = fs.readFileSync('./public.key');

var i = "bazookajoegolf Inc";    // Issuer
var s = "bazookajoegolf@outlook.com";  //Subject
var a = "http://handicap.bazookajoegolf.com"  //audience

var signOptions = {
   issuer : i,
   subject : s,
   audience : a,
   expiresIn: '4h',  //60*60 signifies 1 hr
   algorithm: "RS256"
};
 
var token = jwt.sign(payload, privateKey, signOptions);

//console.log("Token - " + token);

var verifyOptions = {
   issuer : i,
   subject : s,
   audience : a,
   expiresIn: '4h',
   algorithm: ["RS256"]
};


var legit = jwt.verify(token, publicKey, verifyOptions);

console.log("Verification result: " + JSON.stringify(legit));
console.log("expires in : "+ (legit.exp - (new Date() / 1000)));


//run();