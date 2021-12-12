var express = require('express');
var bcrypt = require('bcrypt');
var { body, query } = require('express-validator');
var jwt = require('jsonwebtoken');
var verifyJwt = require('express-jwt');
var { handleValidationResult } = require('../util');

var router = express.Router();

const { sequelize, User } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

/** DELETE an existing user. */
router.delete('/', 
query('username').isString().bail().notEmpty().trim().escape(),
handleValidationResult,
verifyJwt({secret: jwtSecret, algorithms: ['HS256']}),
async function(req, res, next) {
    // Delete the given user
    const usernameJwt = req.user['username'];
    const userToDelete = req.query.username;
    try {
        // Can only delete own user
        if (usernameJwt !== userToDelete) 
            return res.status(403).send('Cannot delete a different user');

        // Start a transaction
        await sequelize.transaction(async t => {
            // Check if the user exists
            const user = await User.findByPk(usernameJwt, {transaction: t});
            if (!user) return res.status(404).send('User not found');
            
            // Delete the user
            await user.destroy({transaction: t});
            res.sendStatus(204);
        });
    } catch (err) {
        next(err);
    }
});

/** POST a new user and generate a new JWT. */
router.post('/signup', 
body('username').isString().bail().notEmpty().trim().escape(),
body('password').isString().bail().notEmpty().trim().escape(),
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
            res.status(409).send('Username already exists')
            return;
        }
        next(err);
    }
});

/** POST (generate and return) a JWT for an existing user. */
router.post('/signin', 
body('username').isString().bail().notEmpty().trim().escape(),
body('password').isString().bail().notEmpty().trim().escape(),
handleValidationResult,
async function(req, res, next) {
    // Generate a new JWT for a sign in
    const { username, password } = req.body;
    try {
        // Get the user info
        const user = await User.findByPk(username);
        if (!user) return res.status(404).send('User not found');
        
        // Check password hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(403).send('Incorrect password');
        
        // Send new JWT
        const token = jwt.sign({username}, jwtSecret, {
            expiresIn: process.env.JWT_DELTA_MINUTES * 60
        });
        res.send(token);
    } catch (err) {
        next(err);
    }
});

/** GET all user names. */
router.get('/', async function(req, res, next) {
    try {
        const users = await User.findAll({
            attributes: ['username']
        });
        res.send(users);
    } catch(err) {
        next(err);
    }
});

module.exports = router;
