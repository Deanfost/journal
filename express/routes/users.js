var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

const { sequelize, User } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

/** POST a new user. */
router.post('/signup', async function(req, res, next) {
    
});

/** GET a JWT for an existing user. */
router.get('/signin', async function(req, res, next) {

});

/** GET all user names. */
router.get('/', async function(req, res, next) {

});

module.exports = router;
