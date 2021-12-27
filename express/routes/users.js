var express = require('express');
var bcrypt = require('bcrypt');
var { body } = require('express-validator');
var jwt = require('jsonwebtoken');
var verifyJwt = require('express-jwt');
var { handleValidationResult, WrappedErrorResponse, httpMessages } = require('../util');

var router = express.Router();

const { sequelize, User } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

/**
 * @swagger
 * /users:
 *  get: 
 *    summary: Get a list of registered usernames
 *    tags: 
 *      - Users
 *    responses: 
 *      200: 
 *        description: OK
 *        content: 
 *          application/json:
 *            schema: 
 *              $ref: '#/components/responses/ArrayOfUsernames'
 */
router.get('/', async function(req, res, next) {
    try {
        const users = await User.findAll({
            attributes: ['username']
        });
        res.send(users.map(u => u.username));
    } catch(err) {
        next(err);
    }
});

/**
 * @swagger
 * /users:
 *  delete: 
 *    summary: Delete the signed-in user and all their data
 *    description: Deletes an existing user given a valid JWT token; also deletes all of the user's data.
 *    tags: 
 *      - Users
 *    security: 
 *      - bearerAuth: []
 *    responses: 
 *      204: 
 *        description: OK
 *      400: 
 *        description: The current user does not exist
 *        content: 
 *          application/json:
 *            schema: 
 *              allOf:
 *                - $ref: '#/components/responses/WrappedErrorResponse'
 *                - type: object
 *                  properties:
 *                    code: 
 *                      example: 400
 *                    msg: 
 *                      example: 
 *                        $ref: '#/components/responses/EXPIRED_USER'
 *      401: 
 *        description: The JWT token is missing or invalid
 *        content: 
 *          application/json:
 *            schema: 
 *              allOf:
 *                - $ref: '#/components/responses/WrappedErrorResponse'
 *                - type: object
 *                  properties:
 *                    code: 
 *                      example: 401
 *                    msg: 
 *                      example: 
 *                        $ref: '#/components/responses/INVALID_TOKEN'
 */
router.delete('/', 
verifyJwt({secret: jwtSecret, algorithms: ['HS256']}),
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    // Start a transaction
    const t = await sequelize.transaction();
    try {
        // Check if the user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            var resp = new WrappedErrorResponse(400, httpMessages.EXPIRED_USER);
            return res.status(400).json(resp);
        }
        
        // Delete the user
        await user.destroy({transaction: t});

        // Commit and send
        await t.commit();
        res.sendStatus(204);
    } catch (err) {
        await t.rollback();
        next(err);
    }
});

/**
 * @swagger
 * /users/signup:
 *  post:
 *    summary: Sign up as a new user
 *    description: Creates a new user account with the given username/password combination; returns a new JWT token upon success.
 *    tags: 
 *      - Users
 *    requestBody:
 *      required: true
 *      content: 
 *        application/json:
 *          schema: 
 *            $ref: '#/components/schemas/UsernamePassword'
 *    responses:
 *      201: 
 *        description: OK
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/responses/JWTToken'
 *      400: 
 *        description: Malformed request
 *        content: 
 *          application/json:
 *            schema: 
 *              allOf:
 *                - $ref: '#/components/responses/WrappedErrorResponse'
 *                - type: object
 *                  properties:
 *                    code: 
 *                      example: 400
 *                    msg: 
 *                      example: Malformed request
 *                    details:
 *                      $ref: '#/components/responses/ValidatorErrors'
 *      409: 
 *        description: Username already exists
 *        content: 
 *          application/json:
 *            schema: 
 *              allOf:
 *                - $ref: '#/components/responses/WrappedErrorResponse'
 *                - type: object
 *                  properties:
 *                    code: 
 *                      example: 409
 *                    msg: 
 *                      example: 
 *                        $ref: '#/components/responses/USER_CONFLICT'
 */
router.post('/signup', 
body('username').isString().bail().notEmpty().trim().escape(),
body('password').isString().bail().notEmpty().trim().escape(),
handleValidationResult,
async function(req, res, next) {
    const { username, password } = req.body;
    try {
        // Hash password
        const salt = await bcrypt.genSalt();
        const digest = await bcrypt.hash(password, salt);

        // Create record
        await User.create({username, password: digest});

        // Send new JWT (never expires)
        const token = jwt.sign({username}, jwtSecret);
        res.status(201).send(token);
    } catch (err) {
        // Catch unique violations
        if (err.name === "SequelizeUniqueConstraintError") {
            var resp = new WrappedErrorResponse(409, httpMessages.USER_CONFLICT);
            res.status(409).json(resp);
            return;
        }
        next(err);
    }
});

/**
 * @swagger
 * /users/signin:
 *  post:
 *    summary: Sign in as an existing user
 *    description: Signs-in as an existing user with the given username/password combination; returns a new JWT token upon success.
 *    tags: 
 *      - Users
 *    requestBody:
 *      required: true
 *      content: 
 *        application/json:
 *          schema: 
 *            $ref: '#/components/schemas/UsernamePassword'
 *    responses:
 *      200: 
 *        description: OK
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/responses/JWTToken'
 *      400: 
 *        description: Malformed request
 *        content: 
 *          application/json:
 *            schema: 
 *              allOf:
 *                - $ref: '#/components/responses/WrappedErrorResponse'
 *                - type: object
 *                  properties:
 *                    code: 
 *                      example: 400
 *                    msg: 
 *                      example: Malformed request
 *                    details:
 *                      $ref: '#/components/responses/ValidatorErrors'
 *      403: 
 *        description: Incorrect password
 *        content:
 *          application/json:
 *            schema: 
 *              allOf:
 *                - $ref: '#/components/responses/WrappedErrorResponse'
 *                - type: object
 *                  properties:
 *                    code: 
 *                      example: 403
 *                    msg: 
 *                      example: 
 *                        $ref: '#/components/responses/INCORRECT_PASSWORD'
 *      404: 
 *        description: User not found
 *        content: 
 *          application/json:
 *            schema: 
 *              allOf:
 *                - $ref: '#/components/responses/WrappedErrorResponse'
 *                - type: object
 *                  properties:
 *                    code: 
 *                      example: 404
 *                    msg: 
 *                      example: 
 *                        $ref: '#/components/responses/USERNAME_NOT_FOUND'
 */
router.post('/signin', 
body('username').isString().bail().notEmpty().trim().escape(),
body('password').isString().bail().notEmpty().trim().escape(),
handleValidationResult,
async function(req, res, next) {
    const { username, password } = req.body;
    try {
        // Get the user info
        const user = await User.findByPk(username);
        if (!user) {
            var resp = new WrappedErrorResponse(404, httpMessages.USERNAME_NOT_FOUND);
            return res.status(404).json(resp);
        }
        
        // Check password hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            var resp = new WrappedErrorResponse(403, httpMessages.INCORRECT_PASSWORD);
            return res.status(403).json(resp);
        }
        
        // Send new JWT (never expires)
        const token = jwt.sign({username}, jwtSecret);
        res.send(token);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
