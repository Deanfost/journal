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

async function checkUserExistsDB(req, res, next) {
    // Check the user exists within the DB (should come after express-jwt handler)
    const usernameJwt = req.user['username'];
    try {
        const user = await User.findByPk(usernameJwt);
        if (!user) return res.status(400).send('Current user does not exist');

        // Attach user instance to req for later use
        req.userInstance = user;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { handleValidationResult, checkUserExistsDB };
