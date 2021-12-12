var express = require('express');
var verifyJwt = require('express-jwt');
var { body, param } = require('express-validator');
var { handleValidationResult, checkUserExistsDB } = require('../util');

var router = express.Router();

const { User, Note } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

// Protect all endpoints in this router with JWT
router.use(verifyJwt({secret: jwtSecret, algorithms: ['HS256']}));

/** GET a list of entries for a user. */
router.get('/', 
checkUserExistsDB,
async function(req, res, next) {
    const user = req.userInstance;
    try {
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
checkUserExistsDB,
async function(req, res, next) {
    const noteTitle = req.body.title;
    const noteContent = req.body.content;
    const user = req.userInstance;
    try {
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
checkUserExistsDB,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    try {
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

/** PUT (replace with a new version) an existing entry. */
router.put('/:entryid', 
param('entryid').isNumeric().bail().notEmpty(),
body('newContent').isString().bail().escape(),
handleValidationResult,
checkUserExistsDB,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const newContent = req.body.newContent;
    try {
        // Get entry
        const entry = await Note.findByPk(entryid);

        // Check access to entry
        if (entry.username !== usernameJwt) 
            return res.status(403).send('You do not have access to this entry');

        // Update the journal entry
        entry.content = newContent;
        await entry.save();

        res.status(200).json(entry);
    } catch (err) {
        next(err);
    }
});

/** DELETE an entry. */
router.delete('/:entryid', async function(req, res, next) {

});

module.exports = router;
