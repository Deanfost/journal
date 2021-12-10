const { exit } = require('process');
const { sequelize } = require('./models');

// Format the DB
async function createModels() {
    try {
        await sequelize.queryInterface.dropAllTables();
        await sequelize.sync();
        console.log('Successfully formatted database');
        exit(0);
    } catch (err) {
        console.error(err);
        exit(1);
    }
}
createModels();
