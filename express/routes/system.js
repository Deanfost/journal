var express = require('express');
var router = express.Router();

/**
 * @swagger
 * /health:
 *  get: 
 *    summary: Perform a healthcheck on the server
 *    tags: 
 *      - System
 *    responses: 
 *      200: 
 *        description: The server is healthy
 */
router.get('/', function (req, res, next) {
  res.sendStatus(200);
});

module.exports = router;
