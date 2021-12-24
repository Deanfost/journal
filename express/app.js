var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var swaggerJsDoc = require('swagger-jsdoc');
var swaggerUI = require('swagger-ui-express');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var entryRouter = require('./routes/entries');
var systemRouter = require('./routes/system');

var app = express();

app.use(logger('dev', {skip: (req, res) => process.env.NODE_ENV === 'test'}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static folder -- update this to serve a front end ---
// app.use(express.static(path.join(__dirname, '..', '/react-app', '/build')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/entries', entryRouter);
app.use('/health', systemRouter);

var swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Journal API',
            description: 'A (very) simple journaling API.',
            contact: {
                name: 'Dean Foster',
                email: 'Deanfoster45@gmail.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5050', 
                description: 'Development server'
            }
        ]
    },
    apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Catch a JWT verification error
app.use(function(err, req, res, next) {
    if (err.name == 'UnauthorizedError') {
        // Invalid JWT
        return res.status(401).send('Invalid token');
    }
    console.error(err);
    next(err);
});

module.exports = app;
