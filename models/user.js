
const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    // mongoose validators
    // minlength, maxlength, match (a regex)
    //  to get a specific value:
    // category : { type: String, required : true, enum: ['web', 'internet', 'popular']}
    // for numbers:  min: 5, max : 200   ----lecture 103
    // custom validators... look at tag validation ---- lecture 104
    // async validators ...  look at async tag   -----lecture 105
    


    // other schema options for strings:  lowercase, uppercase, trim (removes padding)  --- lecture 107
    // custom getters and setters   get : v => Math.round(v)     set: v=> Math.round(v)
    name : {type: String, required : true, minlength: 5, maxlength: 50},  
    email : {type: String, require: true, minlength: 5, maxlength: 50, unique: true},
    password : {type: String, required : true, minlength: 5, maxlength: 1024},
    createDate : {type : Date, default : Date.now},
    isadmin: Boolean

});

const User = mongoose.model('user', userSchema);

function validateUser(user) {
    const schema = {
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(50).required().email(),
        password: Joi.string().min(5).max(50).required()
    }
    return Joi.validate(user,schema);
}

exports.User = User;
exports.validate = validateUser;