var express = require('express');
var verifyJwt = require('express-jwt');
var { body, param } = require('express-validator');
var { handleValidationResult } = require('../util');

var router = express.Router();

const { sequelize, User, Note } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

// Protect all endpoints in this router with JWT
router.use(verifyJwt({secret: jwtSecret, algorithms: ['HS256']}));

/** GET a list of entries for a user. */
router.get('/', async function(req, res, next) {
    const usernameJwt = req.user['username'];
    try {
        // Get user
        const user = await User.findByPk(usernameJwt);
        if (!user) return res.status(400).send('Current user does not exist');

        // Lazy load user's entry index
        const entries = await user.getNotes({
            attributes: ['id', 'title', 'updatedAt']
        });
        const response = {
            count: entries.length,
            user: user.username,
            entries
        };
        res.json(response);
    } catch (err) {
        next(err);
    }
});

/** POST a new entry. */
router.post('/', 
body('title').isString().bail().notEmpty().escape(),
body('content').isString().bail().escape(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const noteTitle = req.body.title;
    const noteContent = req.body.content;
    try {
        // Get user
        const user = await User.findByPk(usernameJwt);
        if (!user) return res.status(400).send('Current user does not exist');

        // Create new journal entry for this user
        const newEntry = await user.createNote({
            title: noteTitle,
            content: noteContent
        });
        res.status(201).json(newEntry);
    } catch (err) {
        next(err);
    }
});

/** GET an existing entry's content. */
router.get('/:entryid', 
param('entryid').isNumeric().bail().notEmpty(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    try {
        // Check user
        const user = await User.findByPk(usernameJwt);
        if (!user) return res.status(400).send('Current user does not exist');

        // Lazy load entry content
        const entry = await Note.findByPk(entryid);
        if (!entry) return res.status(404).send('Entry does not exist');

        // Check access to entry
        if (entry.username !== usernameJwt) 
            return res.status(403).send('You do not have access to this entry');

        res.json(entry);
    } catch (err) {
        next(err);
    }
});

/** PUT an update for an existing entry. */
router.put('/:entryid', async function(req, res, next) {

});

/** DELETE an entry. */
router.delete('/:entryid', async function(req, res, next) {

});

module.exports = router;
