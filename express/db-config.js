const { exit } = require('process');
const { sequelize } = require('./models');

// Format the connected DB (determined within ./models/index.js)
async function formatDBs() {
    try {
        await sequelize.queryInterface.dropAllTables();
        await sequelize.sync();
        console.log(`Successfully formatted '${sequelize.config.database}' database`);
        await sequelize.close();
        exit(0);
    } catch (err) {
        console.error(err);
        exit(1);
    }
}
formatDBs();
