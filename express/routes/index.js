var express = require('express');
var router = express.Router();

/**
 * @swagger
 * /:
 *  get: 
 *    summary: View the web app (if one is provided)
 *    tags: 
 *      - frontend
 *    produces: 
 *      - text/html
 *    responses: 
 *      200: 
 *        description: A successful response
 *      501: 
 *        description: The web app has not been provided
 */
router.get('/', function (req, res, next) {
  return res.sendStatus(501);
  res.render('index', { title: 'Journal' });
});

module.exports = router;
