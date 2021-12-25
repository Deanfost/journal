var express = require('express');
var verifyJwt = require('express-jwt');
var { body, param } = require('express-validator');
var { handleValidationResult } = require('../util');

var router = express.Router();

const { User, Note, sequelize } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

// Protect all endpoints in this router with JWT
router.use(verifyJwt({secret: jwtSecret, algorithms: ['HS256']}));

/**
 * @swagger
 * /entries/:
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
 *              $ref: '#/components/responses/CurrentUserDNEError'
 *      401: 
 *        description: The JWT token is missing or invalid
 *        content: 
 *          application/json:
 *            schema: 
 *              $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', 
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const t = await sequelize.transaction();
    try {
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            return res.status(400).send('Current user does not exist');
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
 * /entries/:
 *  post: 
 *    summary: Create a new journal entry.
 *    description: Creates a new journal entry for the signed-in user. 
 *    tags: 
 *      - Entries
 *    security: 
 *      - bearerAuth: []
 *    responses: 
 *      201: 
 *        description: OK
 *        content: 
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/EntryIndex'
 *      400: 
 *        description: The signed-in user does not exist, or malformed request
 *        content: 
 *          application/json:
 *            schema: 
 *              oneOf:
 *                - $ref: '#/components/responses/CurrentUserDNEError'
 *                - $ref: '#/components/responses/MalformedRequestError'
 *      401: 
 *        description: The JWT token is missing or invalid
 *        content: 
 *          application/json:
 *            schema: 
 *              $ref: '#/components/responses/UnauthorizedError'
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
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            return res.status(400).send('Current user does not exist');
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

/** GET an existing entry's content. */
router.get('/:entryid', 
param('entryid').isNumeric(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const t = await sequelize.transaction();
    try {
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            return res.status(400).send('Current user does not exist');
        }

        // Lazy load entry content
        const entry = await Note.findByPk(entryid, {transaction: t});
        if (!entry) {
            await t.rollback();
            return res.status(404).send('Entry does not exist');
        }

        // Check access to entry
        // (We do this instead of querying the Notes association so a row
        // showing up missing above is not confused for having no access to it)
        if (entry.username !== usernameJwt) {
            await t.rollback();
            return res.status(403).send('You do not have access to this entry');
        }

        // Commit and send
        await t.commit();
        res.json(entry);
    } catch (err) {
        await t.rollback();
        next(err);
    }
});

/** PUT (replace with a new version) an existing entry. */
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
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            return res.status(400).send('Current user does not exist');
        }

        // Get entry
        const entry = await Note.findByPk(entryid, {transaction: t});
        if (!entry) {
            await t.rollback();
            return res.status(404).send('Entry does not exist');
        }

        // Check access to entry
        // (We do this instead of querying the Notes association so a row
        // showing up missing above is not confused for having no access to it)
        if (entry.username !== usernameJwt) {
            await t.rollback();
            return res.status(403).send('You do not have access to this entry');
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

/** DELETE an entry. */
router.delete('/:entryid', 
param('entryid').isNumeric(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const t = await sequelize.transaction();
    try {
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) {
            await t.rollback();
            return res.status(400).send('Current user does not exist');
        }

        // Get entry
        const entry = await Note.findByPk(entryid, {transaction: t});
        if (!entry) {
            await t.rollback();
            return res.status(404).send('Entry does not exist');
        }

        // Check access to entry
        // (We do this instead of querying the Notes association so a row
        // showing up missing above is not confused for having no access to it)
        if (entry.username !== usernameJwt) {
            await t.rollback();
            return res.status(403).send('You do not have access to this entry');
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
