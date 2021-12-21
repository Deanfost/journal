var { sequelize } = require('../models');
const usersSuite = require('./users-test');
const entriesSuite = require('./entries-test');

after(async function() {
    await sequelize.close();
});
