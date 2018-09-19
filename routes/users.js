const config = require('config');
const {User, validate} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();


// get all users
router.get('/', async (req, res) => {
    const users = await User.find();
    console.log(users);
    res.send(users);
});

router.get('/:id', async (req, res) => {

    const user = await User.findById(req.params.id);
    if(!user) return  res.status(404).send("User not found");
    res.send(user);
    
    //res.send(req.params.id);
    // req.query would get the values url ?=sortBy=2
});


router.post ('/', async (req,res)=> {
       const result = validate(req.body);

    if (result.error) {
        // 400 bad request
        return res.status(400).send(result.error.details[0].message);
        
    }
   
    res.send(course);
});


router.put('/:id', (req, res) =>{
    const course = courses.find(c=> c.id === parseInt(req.params.id));
    if(!course) return res.status(404).send("Course not found");

    const result = validateCourse(req.body);
    //const {error} = validateCourse(req.body);
    // if(error) {...}

    if (result.error) {
        // 400 bad request
       return  res.status(400).send(result.error.details[0].message);
        
    }

    course.name = req.body.name;
    res.send(course);
    
});

module.exports = router;