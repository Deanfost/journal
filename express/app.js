var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var signinRouter = require('./routes/signin');
var signupRouter = require('./routes/signup');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static folder - react-app/build
app.use(express.static(path.join(__dirname, '..', '/react-app', '/build')));

app.use('/', indexRouter);
app.use('/signin', signinRouter);
app.use('/signup', signupRouter);

module.exports = app;
