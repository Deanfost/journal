var { validationResult } = require('express-validator');
var bcrypt = require('bcrypt');

function handleValidationResult(req, res, next) {
    // Validate body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * Not safe DO NOT use for security purposes
 */
function makeString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

async function hashPassword(pass) {
    var salt = await bcrypt.genSalt();
    var digest = await bcrypt.hash(pass, salt);
    return digest;
}

module.exports = { handleValidationResult, hashPassword, makeString };
