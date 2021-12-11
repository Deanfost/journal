/**
 * This file is used to configure Sequelize.
 */

// Env config
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env')
});

module.exports = {
  "db": {
    "username": process.env.POSTGRES_USER,
    "password": process.env.POSTGRES_PASSWORD,
    "database": "db",
    "host": "localhost",
    "dialect": "postgres",
    "logging": false
  },
  "test": {
    "username": process.env.POSTGRES_USER,
    "password": process.env.POSTGRES_PASSWORD,
    "database": "db_test",
    "host": "localhost",
    "dialect": "postgres",
    "logging": false
  },
  // "production": {
  //   "username": process.env.POSTGRES_USER,
  //   "password": process.env.POSTGRES_PASSWORD,
  //   "database": "database_production",
  //   "host": "127.0.0.1:5432",
  //   "dialect": "postgres"
  // }
}
