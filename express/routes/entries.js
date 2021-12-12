var express = require('express');
var verifyJwt = require('express-jwt');
var { body, param } = require('express-validator');
var { handleValidationResult } = require('../util');

var router = express.Router();

const { User, Note, sequelize } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

// Protect all endpoints in this router with JWT
router.use(verifyJwt({secret: jwtSecret, algorithms: ['HS256']}));

/** GET a list of entries for a user. */
router.get('/', 
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const t = await sequelize.transaction();
    try {
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) return res.status(400).send('Current user does not exist');

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

/** POST a new entry. */
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
        if (!user) return res.status(400).send('Current user does not exist');

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
param('entryid').isNumeric().bail().notEmpty(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const t = await sequelize.transaction();
    try {
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) return res.status(400).send('Current user does not exist');

        // Lazy load entry content
        const entry = await Note.findByPk(entryid, {transaction: t});
        if (!entry) return res.status(404).send('Entry does not exist');

        // Check access to entry
        // (We do this instead of querying the Notes association so a row
        // showing up missing above is not confused for having no access to it)
        if (entry.username !== usernameJwt) 
            return res.status(403).send('You do not have access to this entry');

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
param('entryid').isNumeric().bail().notEmpty(),
body('newContent').isString().bail().escape(),
handleValidationResult,
async function(req, res, next) {
    const usernameJwt = req.user['username'];
    const entryid = req.params.entryid;
    const newContent = req.body.newContent;
    const t = await sequelize.transaction();
    try {
        // Check user exists
        const user = await User.findByPk(usernameJwt, {transaction: t});
        if (!user) return res.status(400).send('Current user does not exist');

        // Get entry
        const entry = await Note.findByPk(entryid, {transaction: t});

        // Check access to entry
        if (entry.username !== usernameJwt) 
            return res.status(403).send('You do not have access to this entry');

        // Update the journal entry
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
router.delete('/:entryid', async function(req, res, next) {
    res.status(501).send('Unimplemented');
});

module.exports = router;
