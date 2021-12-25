var { validationResult } = require('express-validator');
var bcrypt = require('bcrypt');

class WrappedErrorResponse {
    constructor(code, msg, details = null) {
        this.code = code;
        this.msg = msg;
        this.details = details;
    }
    
    toJSON() {
        return {
            code: this.code,
            msg: this.msg,
            details: this.details
        };
    }
}

const httpMessages = {
    EXPIRED_USER: 'Current user does not exist',
    USER_CONFLICT: 'Username already exists',
    USERNAME_NOT_FOUND: 'User not found',
    INCORRECT_PASSWORD: 'Incorrect password',
    INVALID_TOKEN: 'Invalid token',
    MALFORMED_REQUEST: 'Malformed request',
    ENTRY_NOT_FOUND: 'Entry does not exist',
    ENTRY_NO_ACCESS: 'You do not have access to this entry'
};

function handleValidationResult(req, res, next) {
    // Validate body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        var resp = new WrappedErrorResponse(400, httpMessages.MALFORMED_REQUEST, errors.array());
        return res.status(400).json(resp);
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

module.exports = { 
    handleValidationResult, hashPassword, makeString, 
    WrappedErrorResponse, httpMessages 
};
