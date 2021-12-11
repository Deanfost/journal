var express = require('express');
var bcrypt = require('bcrypt');
var { body } = require('express-validator');
var jwt = require('jsonwebtoken');
var { handleValidationResult } = require('../util');

var router = express.Router();

const { sequelize, User } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

/** POST a new user and return a new JWT. */
router.post('/signup', 
body('username').notEmpty().isString(),
body('password').notEmpty().isString(),
handleValidationResult,
async function(req, res, next) {
    // Create new user 
    const { username, password } = req.body;
    try {
        // Hash password
        const salt = await bcrypt.genSalt();
        const digest = await bcrypt.hash(password, salt);

        // Create record
        await User.create({username, password: digest});

        // Send new JWT
        const token = jwt.sign({username}, jwtSecret, {
            expiresIn: process.env.JWT_DELTA_MINUTES * 60
        });
        res.status(201).send(token);
    } catch (err) {
        // Catch unique violations
        if (err.name === "SequelizeUniqueConstraintError") {
            res.status(409).send('User name already exists')
            return;
        }
        console.log(err);
        res.sendStatus(500);
    }
});

/** GET (generate) a JWT for an existing user. */
router.get('/signin', 
body('username').notEmpty().isString(),
body('password').notEmpty().isString(),
handleValidationResult,
async function(req, res, next) {


    
});

/** GET all user names. */
router.get('/', async function(req, res, next) {
    const users = await User.findAll({
        attributes: ['username']
    });
    res.send(users);
});

module.exports = router;
