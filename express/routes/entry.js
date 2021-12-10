var express = require('express');
var router = express.Router();

const { sequelize, User } = require('../models');
const jwtSecret = process.env.JWT_SECRET;

/** GET a list of entries for a user. */
router.get('/', async function(req, res, next) {

});

/** GET an existing entry's content. */
router.get('/:entryid', async function(req, res, next) {

});

/** PUT an update for an existing entry. */
router.put('/:entryid', async function(req, res, next) {

});

/** POST a new entry. */
router.post('/', async function(req, res, next) {

});

/** DELETE an entry. */
router.delete('/:entryid', async function(req, res, next) {

});

module.exports = router;
