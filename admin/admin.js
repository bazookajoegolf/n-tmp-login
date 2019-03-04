
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const {User, validate} = require('../models/user');
const router = express.Router();

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');


// returns a list of users

router.get('/', auth, admin, async (req, res)=> {

    if(!req.user.isadmin)  return res.status(401).send("not authorized...gtfo");
   
   // get all users
   const users = await User.find().select('-password');
   console.log(users);
   return res.status(200).send(users);
    

});

router.delete('/:id', auth, admin, async (req ,res) =>{
    
    const user = await User.findById( req.params.id);
    if(!user)  return res.status(401).send("User Not Found...");
 
    if(user.email === req.body.email) {
        user.delete();
        return res.status(200).send("User Successfully Deleted");
    } else {
        return res.status(404).send("Malformed Delete Request");
    }


});

router.put('/:id', auth, admin, async (req ,res) =>{
    
    const user = await User.findById( req.params.id);
   // console.log(user);
    if(!user)  return res.status(401).send("User Not Found...");
 
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
       
        return res.status(200).send("User Successfully Updated");
    } else {
        return res.status(404).send("Unable to update Profile");
    }


});

router.post('/', auth, admin, async (req ,res) =>{
    
    const result = validate(req.body);
    
    if (result.error) {
        // 400 bad request
        return res.status(400).send(result.error.details[0].message );
        
    }

    let user = await User.findOne({email: req.body.email});
    
    if(user) return res.status(400).send('User is already registered');

    user = new User( _.pick(req.body,['name', 'email','password','isadmin']));
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);


    await user.save();
    const token = user.generateAuthToken();
   
    res.header('x-auth-token', token).send(_.pick(user, ['_id','name','email' ]));


});

module.exports = router;