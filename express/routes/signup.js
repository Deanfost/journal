var express = require('express');
var router = express.Router();

const { sequelize, User } = require('../models');

/** POST a new user. */
router.post('/', async function(req, res, next){
    
});

module.exports = router;
