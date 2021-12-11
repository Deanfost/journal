var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var entryRouter = require('./routes/entry');
var systemRouter = require('./routes/system');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static folder - react-app/build
app.use(express.static(path.join(__dirname, '..', '/react-app', '/build')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/entries', entryRouter);
app.use('/health', systemRouter);

// Error handler for JWT
app.use(function(err, req, res, next) {
    if (err.name == 'UnauthorizedError') {
        // Invalid JWT
        return res.status(401).send('Invalid token');
    }
    next(err);
});

module.exports = app;
