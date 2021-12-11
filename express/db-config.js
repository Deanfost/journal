const { exit } = require('process');
const { sequelize } = require('./models');

// Format the connected DB (determined within ./models)
async function formatDBs() {
    try {
        await sequelize.queryInterface.dropAllTables();
        await sequelize.sync();
        console.log(`Successfully formatted ${sequelize.config.database} database`);
        exit(0);
    } catch (err) {
        console.error(err);
        exit(1);
    }
}
formatDBs();
