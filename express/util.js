var { validationResult } = require('express-validator');
const { User } = require('./models');

function handleValidationResult(req, res, next) {
    // Validate body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { handleValidationResult };
