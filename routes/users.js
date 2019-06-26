
const _ = require('lodash');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const config = require('config');
// const jwt = require('jsonwebtoken');
const {User, validate, validateUpdate} = require('../models/user');
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
   // console.log("hello  " + user.name);
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
    
    if(newuser) return res.status(409).send('User is already registered');

    // delete any previous requests from the email
    const oldRequest = await NewUser.findOneAndDelete({email: req.body.email});

   

    newuser = new NewUser( _.pick(req.body,['name', 'email','password','isadmin']));
    
    const salt = await bcrypt.genSalt(10);
    newuser.password = await bcrypt.hash(newuser.password, salt);
    newuser.expireCreateTime =  Date.now() + 14400000 ;   // 4hrs
    //console.log(newuser);

    await newuser.save();

    let transport = nodemailer.createTransport({
        host : "mail.template.baz",
        port : 25, 

        auth: null

    }); 

    const textbody = `Click the following link OR ${config.get('host')}/validateuser/${newuser._id}`;

    const htmlbody = `<div><h3 style="margin-bottom: 40px;text-align: center">To confirm your new account click the following link and enter code: </h3>
			   <p style="margin-bottom:30px;text-align: center"> ${config.get('host')}/validateuser/ </p> 
			   <p style="text-align:center">OR:    enter the following code into the Confirmation page.  ${newuser._id} </p>
		     </div>`;
	
    let mailOptions = {
        from: 'putinconfigyourfromaddress@someaddress.com',
        to:  'brad.zingle@harvestenergy.ca',         //req.body.email,
        subject: 'New User Confirmation',
        html: htmlbody
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
   res.status(201).send({message:"Request posted....an Email will be sent to you shortly to confirm your account!"});
});

//verified account api

router.post('/:id', async (req,res)=>{
    console.log(mongoose.Types.ObjectId.isValid(req.params.id));
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send("Invalid Confirmation Number");
    const newuser = await NewUser.findById( req.params.id);
    if(!newuser)  return res.status(404).send("Profile Not Found or Expired");

    const posteduser = new User ({
        "name" : newuser.name,
        "password" : newuser.password,
        "email" : newuser.email,
        "isadmin" : newuser.isadmin
    });

    const saveresult = posteduser.save();
    if(saveresult) {
        newuser.remove();
        return res.status(200).send({message:"Your User Account has been created, you may now login"});
    } else {
        return res.status(500).send({message:"there was an error validating your request"});
    }


});


// update profile

router.put('/:id', auth,  async (req ,res) =>{
    
    const user = await User.findById( req.params.id);
   
    if(!user)  return res.status(404).send("Profile Not Found...");
    // console.log("user Routes... show body " + req.body.oldpassword);
    const validPassword = await bcrypt.compare(req.body.oldpassword, user.password);
    if (!validPassword ) return res.status(400).send({message:'Invalid user or password'});
 
    if(validPassword) {

	const duplicateEmail = await User.findOne({email: req.body.email});
	//console.log(user.email);
	//checking to see if update is changing the email address. If so, checks to see that it isn't being changed to an existing email
	if(duplicateEmail && user.email !==req.body.email) return res.status(400).send({message: 'Email address Already exists!'});
        user.name = req.body.name;
        user.email = req.body.email;
       // user.isadmin = "false";
        if(req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        } else {
            req.body.password = user.password;

        }

        const result = validateUpdate(req.body);
	
	//const result = validateUpdate(user);
        if (result.error) {
            // 400 bad request
	    console.log (req.body);
            return res.status(400).send({message : result.error.details[0].message } );
            
        }
        user.save();
	//generate new token with new information
	const token = user.generateAuthToken();
       
        return res.status(200).send({message : "Profile Successfully Updated", "token" : token, "user" : user});
    } else {
        return res.status(400).send({message : "Unable to update Profile"});
    }


});




module.exports = router;
