
const _ = require('lodash');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const config = require('config');
// const jwt = require('jsonwebtoken');
const {User, validate} = require('../models/user');
const {NewUser} = require('../models/newuser');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');


// returns current profile if authorized.

router.get('/me', auth, async (req, res) => {

    // request only contains header token which contains _id
    // can return more items here
    const user = await User.findById(req.user._id).select('-password');
    console.log("hello  " + user.name);
    if(!user) return  res.status(404).send("User not found");
    res.send(user);
    
    //res.send(req.params.id);
    // req.query would get the values url ?=sortBy=2
    
});

// create an account

router.post('/',  async (req, res) => {

    // const theError = new Error('do not like you');
    // console.log(`I'm an error from users.js  ${theError.message}` );
    // throw err;

    // const p = Promise.reject('promise error');
    // p.then();

    const result = validate(req.body);
    
    if (result.error) {
        // 400 bad request
        return res.status(400).send(result.error.details[0].message );
        
    }

    let newuser = await User.findOne({email: req.body.email});
    
    if(newuser) return res.status(400).send('User is already registered');

    // delete any previous requests from the email
    const oldRequest = await NewUser.findOneAndDelete({email: req.body.email});

   

    newuser = new NewUser( _.pick(req.body,['name', 'email','password','isadmin']));
    
    const salt = await bcrypt.genSalt(10);
    newuser.password = await bcrypt.hash(newuser.password, salt);
    newuser.expireCreateTime =  Date.now() + 14400000 ;   // 4hrs
    console.log(newuser);

    await newuser.save();

    let transport = nodemailer.createTransport({
        host : "smtp.shaw.ca",
        port : 25, 

        auth: null

    });

    const textbody = `${config.get('host')}/api/users/${newuser._id}`;
    let mailOptions = {
        from: 'putinconfigyourfromaddress@someaddress.com',
        to:  'bzingle@shaw.ca',         //req.body.email,
        subject: 'New User Confirmation',
        text: textbody
    };
    transport.sendMail(mailOptions, function(err, info){
        if (err) console.log(err);
        else {
            //console.log('email sent: ' + info.response);
            //post entry to the reset collection 
        };
    });


    //const token = newuser.generateAuthToken();
   
   // res.header('x-auth-token', token).send(_.pick(user, ['_id','name','email' ]));
   res.status(200).send("Request posted....an Email will be sent to you shortly to confirm your account!");
});

//verified account api

router.get('/:id', async (req,res)=>{

    const newuser = await NewUser.findById( req.params.id);
    if(!newuser)  return res.status(404).send("Profile Not Found or expired");

    const posteduser = new User ({
        "name" : newuser.name,
        "password" : newuser.password,
        "email" : newuser.email,
        "isadmin" : newuser.isadmin
    });

    const saveresult = posteduser.save();
    if(saveresult) {
        newuser.remove();
        return res.status(201).send("Your User Account has been created, you may now login");
    } else {
        return res.status(500).send("there was an error validating your request");
    }


});


// update profile

router.put('/:id', auth,  async (req ,res) =>{
    
    const user = await User.findById( req.params.id);
   // console.log(user);
    if(!user)  return res.status(404).send("Profile Not Found...");
 
    if(user.email === req.body.email) {
        user.name = req.body.name;
        user.email = req.body.email;
        user.isadmin = req.body.isadmin;
        if(req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        } else {
            req.body.password = user.password;

        }

        const result = validate(req.body);
        if (result.error) {
            // 400 bad request
            return res.status(400).send(result.error.details[0].message );
            
        }
        user.save();
       
        return res.status(200).send("Profile Successfully Updated");
    } else {
        return res.status(400).send("Unable to update Profile");
    }


});




module.exports = router;