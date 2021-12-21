var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

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
