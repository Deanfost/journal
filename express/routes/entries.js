var express = require('express');
var verifyJwt = require('express-jwt');
var { body, param } = require('express-validator');
var { handleValidationResult, httpMessages, WrappedErrorResponse } = require('../util');

var router = express.Router();

const { User, Note, sequelize } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

// Protect all endpoints in this router with JWT
router.use(verifyJwt({secret: jwtSecret, algorithms: ['HS256']}));

/**
 * @swagger
 * /entries:
 *  get: 
 *    summary: Get a list of the user's entries
 *    description: Returns an index of the signed-in user's entries.
 *    tags: 
 *      - Entries
 *    security: 
 *      - bearerAuth: []
 *    responses: 
 *      200: 
 *        description: OK
 *        content: 
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/EntryIndex'
 *      400: 
 *        description: The signed-in user does not exist 
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
router.get('/', 
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const t = await sequelize.transaction();
    try {
        // Check current user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            var resp = new WrappedErrorResponse(400, httpMessages.EXPIRED_USER);
            return res.status(400).json(resp);
        }

        // Lazy load user's entry index
        const entries = await user.getNotes({
            attributes: ['id', 'title', 'updatedAt'],
            transaction: t
        });
        const response = {
            count: entries.length,
            user: user.username,
            entries
        };

        // Commit and send
        await t.commit();
        res.json(response);
    } catch (err) {
        await t.rollback();
        next(err);
    }
});

/**
 * @swagger
 * /entries:
 *  post: 
 *    summary: Create a new journal entry
 *    description: Creates a new journal entry for the signed-in user. 
 *    tags: 
 *      - Entries
 *    security: 
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content: 
 *        application/json:
 *          schema: 
 *            $ref: '#/components/schemas/NewNote'
 *    responses: 
 *      201: 
 *        description: OK
 *        content: 
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/FullEntry'
 *      400: 
 *        description: The signed-in user does not exist OR malformed request
 *        content: 
 *          application/json:
 *            schema: 
 *              oneOf:
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: 
 *                          $ref: '#/components/responses/EXPIRED_USER'
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: Malformed request
 *                      details:
 *                        $ref: '#/components/responses/ValidatorErrors'
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
router.post('/', 
body('title').isString().bail().notEmpty().escape(),
body('content').isString().bail().escape(),
handleValidationResult,
async function(req, res, next) {
    const noteTitle = req.body.title;
    const noteContent = req.body.content;
    const usernameJwt = req.user['username'];
    const t = await sequelize.transaction();
    try {
        // Check current user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            var resp = new WrappedErrorResponse(400, httpMessages.EXPIRED_USER);
            return res.status(400).json(resp);
        }

        // Create new journal entry for this user
        const newEntry = await user.createNote({
            title: noteTitle,
            content: noteContent
        }, {transaction: t});

        // Commit and send
        await t.commit();
        res.status(201).json(newEntry);
    } catch (err) {
        await t.rollback();
        next(err);
    }
});

/**
 * @swagger
 * /entries/{entryid}:
 *  get: 
 *    summary: Get an existing journal entry
 *    description: Retrieves an existing journal entry for the signed-in user. 
 *    tags: 
 *      - Entries
 *    security: 
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: entryid
 *        schema: 
 *          type: integer
 *        required: true
 *        description: Numeric ID of the entry
 *    responses: 
 *      200: 
 *        description: OK
 *        content: 
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/FullEntry'
 *      400: 
 *        description: The signed-in user does not exist OR malformed request
 *        content: 
 *          application/json:
 *            schema: 
 *              oneOf:
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: 
 *                          $ref: '#/components/responses/EXPIRED_USER'
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: Malformed request
 *                      details:
 *                        $ref: '#/components/responses/ValidatorErrors'
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
 *      403: 
 *        description: The user does not own the entry
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
 *                        $ref: '#/components/responses/ENTRY_NO_ACCESS'
 *      404: 
 *        description: The entry could not be found
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
 *                        $ref: '#/components/responses/ENTRY_NOT_FOUND'
 */
router.get('/:entryid', 
param('entryid').isNumeric(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const t = await sequelize.transaction();
    try {
        // Check current user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            var resp = new WrappedErrorResponse(400, httpMessages.EXPIRED_USER);
            return res.status(400).json(resp);
        }

        // Lazy load entry content
        const entry = await Note.findByPk(entryid, {transaction: t});
        if (!entry) {
            await t.rollback();
            var resp = new WrappedErrorResponse(404, httpMessages.ENTRY_NOT_FOUND);
            return res.status(404).json(resp);
        }

        // Check access to entry
        // (We do this instead of querying the Notes association so a row
        // showing up missing above is not confused for having no access to it)
        if (entry.username !== usernameJwt) {
            await t.rollback();
            var resp = new WrappedErrorResponse(403, httpMessages.ENTRY_NO_ACCESS);
            return res.status(403).json(resp);
        }

        // Commit and send
        await t.commit();
        res.json(entry);
    } catch (err) {
        await t.rollback();
        next(err);
    }
});

/**
 * @swagger
 * /entries/{entryid}:
 *  put: 
 *    summary: Update an existing journal entry
 *    description: Updates an existing journal entry (title and content) for the signed-in user. Automatically notes entry's update time.
 *    tags: 
 *      - Entries
 *    security: 
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: entryid
 *        schema: 
 *          type: integer
 *        required: true
 *        description: Numeric ID of the entry
 *    requestBody:
 *      required: true
 *      content: 
 *        application/json:
 *          schema: 
 *            $ref: '#/components/schemas/NoteUpdate'
 *    responses: 
 *      200: 
 *        description: OK
 *        content: 
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/FullEntry'
 *      400: 
 *        description: The signed-in user does not exist OR malformed request
 *        content: 
 *          application/json:
 *            schema: 
 *              oneOf:
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: 
 *                          $ref: '#/components/responses/EXPIRED_USER'
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: Malformed request
 *                      details:
 *                        $ref: '#/components/responses/ValidatorErrors'
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
 *      403: 
 *        description: The user does not own the entry
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
 *                        $ref: '#/components/responses/ENTRY_NO_ACCESS'
 *      404: 
 *        description: The entry could not be found
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
 *                        $ref: '#/components/responses/ENTRY_NOT_FOUND'
 */
router.put('/:entryid', 
param('entryid').isNumeric(),
body('newTitle').isString().bail().escape(),
body('newContent').isString().bail().escape(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const newTitle = req.body.newTitle;
    const newContent = req.body.newContent;
    const t = await sequelize.transaction();
    try {
        // Check current user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            var resp = new WrappedErrorResponse(400, httpMessages.EXPIRED_USER);
            return res.status(400).json(resp);
        }

        // Get entry
        const entry = await Note.findByPk(entryid, {transaction: t});
        if (!entry) {
            await t.rollback();
            var resp = new WrappedErrorResponse(404, httpMessages.ENTRY_NOT_FOUND);
            return res.status(404).json(resp);
        }

        // Check access to entry
        // (We do this instead of querying the Notes association so a row
        // showing up missing above is not confused for having no access to it)
        if (entry.username !== usernameJwt) {
            await t.rollback();
            var resp = new WrappedErrorResponse(403, httpMessages.ENTRY_NO_ACCESS);
            return res.status(403).json(resp);
        }

        // Update the journal entry
        entry.title = newTitle;
        entry.content = newContent;
        await entry.save();

        // Commit and send
        await t.commit();
        res.status(200).json(entry);
    } catch (err) {
        await t.rollback();
        next(err);
    }
});

/**
 * @swagger
 * /entries/{entryid}:
 *  delete: 
 *    summary: Delete an existing journal entry
 *    description: Deletes an existing journal entry for the signed-in user. 
 *    tags: 
 *      - Entries
 *    security: 
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: entryid
 *        schema: 
 *          type: integer
 *        required: true
 *        description: Numeric ID of the entry
 *    responses: 
 *      204: 
 *        description: OK
 *      400: 
 *        description: The signed-in user does not exist OR malformed request
 *        content: 
 *          application/json:
 *            schema: 
 *              oneOf:
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: 
 *                          $ref: '#/components/responses/EXPIRED_USER'
 *                - allOf:
 *                  - $ref: '#/components/responses/WrappedErrorResponse'
 *                  - type: object
 *                    properties:
 *                      code: 
 *                        example: 400
 *                      msg: 
 *                        example: Malformed request
 *                      details:
 *                        $ref: '#/components/responses/ValidatorErrors'
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
 *      403: 
 *        description: The user does not own the entry
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
 *                        $ref: '#/components/responses/ENTRY_NO_ACCESS'
 *      404: 
 *        description: The entry could not be found
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
 *                        $ref: '#/components/responses/ENTRY_NOT_FOUND'
 */
router.delete('/:entryid', 
param('entryid').isNumeric(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const t = await sequelize.transaction();
    try {
        // Check current user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            var resp = new WrappedErrorResponse(400, httpMessages.EXPIRED_USER);
            return res.status(400).json(resp);
        }

        // Get entry
        const entry = await Note.findByPk(entryid, {transaction: t});
        if (!entry) {
            await t.rollback();
            var resp = new WrappedErrorResponse(404, httpMessages.ENTRY_NOT_FOUND);
            return res.status(404).json(resp);
        }

        // Check access to entry
        // (We do this instead of querying the Notes association so a row
        // showing up missing above is not confused for having no access to it)
        if (entry.username !== usernameJwt) {
            await t.rollback();
            var resp = new WrappedErrorResponse(403, httpMessages.ENTRY_NO_ACCESS);
            return res.status(403).json(resp);
        }

        // Delete the journal entry
        await entry.destroy({transaction: t});

        // Commit and send
        await t.commit();
        res.sendStatus(204);
    } catch (err) {
        await t.rollback();
        next(err);
    }
});

module.exports = router;
