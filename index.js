
require('express-async-errors');

const config = require('config');

// const morgan = require('morgan');  // logging middleware

// load express
const express = require('express')
const app = express();

//config start 
require('./startup/config')(app);

//error exception logging
require('./startup/logging')();

// db connection
require('./startup/database')();

//routes
require('./startup/routes')(app);

//development debug
require('./startup/debug-dev')(app);


app.get('/', (req, res)=> {
    //res.send('hello you');
    res.send(" home page");
});



// in ubuntu run export PORT = 3000 set the env var  *** case sensitive ***

const port = process.env.PORT || 3000;
//console.log("The port in the environment is  " + port);
app.listen(port, () => console.log(`Listening on port ${port}`));


