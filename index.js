
const startupdebug = require('debug')('app:startup');
const dbdebug = require('debug')('app:db');
const config = require('config');
const helmet = require('helmet');
const morgan = require('morgan');

// load express
const express = require('express')
const app = express();

app.use(helmet());   // used to secure http headers. add soon as possible


// database connection
const mongoose = require('mongoose');

// use config to define db connection string
mongoose.connect(config.db, {useNewUrlParser : true, useCreateIndexes : true })
    .then(()=> console.log('Connected to Mongodb'))
    .catch((err)=> console.error('Unable to connect to MongoDB...', err));

// Routes
const courses = require('./routes/courses');
app.use('/api/courses', courses);

const users = require('./routes/users');
app.use('/api/users', users);

// configuration example
// in linux enter export NODE_ENV = production   to change from the default of development
// to reset env variable type:   export NODE_ENV=  
console.log('Application name: ' + config.get('name') );
console.log('Mail server: ' + config.get('mail.host') );
//console.log('password: ' + config.get('mail.password') );

// in linux enter export NODE_ENV = production   to change from the default of development
if(app.get('env') === 'development') {
    app.use(morgan('tiny'));
    // startupdebug a part of the debug package. type in terminal export DEBUG=app:startup to see the output below
    // to show multiple messages type:  export DEBUG=app:startup,app:db   or to see all type export DEBUT=app:*
    // to do at startup type DEBUG=app:startup nodemon index.js
    // if you only have 1 debug type you can set the constant to debug 
    startupdebug('Morgan started');  
}

app.use(express.json());
// app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));


app.use(function(req,res,next){
    console.log('authenticating...');
    next();
});


app.get('/', (req, res)=> {
    //res.send('hello you');
    res.send(" home page");
});



// in ubuntu run export PORT = 3000 set the env var  *** case sensitive ***

const port = process.env.PORT || 3001;
startupdebug("The port in the environment is" + process.env.PORT)
app.listen(port, () => console.log(`Listening on port ${port}`));


