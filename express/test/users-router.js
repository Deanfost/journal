var { sequelize, User } = require('../models');
var chai = require('chai');
var chaiHttp = require('chai-http');
var bcrypt = require('bcrypt');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var server = require('../app');

chai.use(chaiHttp);

describe('/users router', function() {
    beforeEach(async function() {
        // Reset table state before each test
        await User.destroy({
            truncate: true
        });

        var salt = await bcrypt.genSalt();
        var digest = await bcrypt.hash('1234', salt);
        User.create({username: 'dean1', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('12', salt);
        User.create({username: 'dean2', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('34', salt);
        User.create({username: 'dean3', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('14', salt);
        User.create({username: 'dean4', password: digest});
    });

    describe('DELETE /', function() {
        it('', async function() {
            
        });
    });

    describe('POST /signup', function() {

    });   

    describe('GET /signin', function() {

    });  

    describe('GET /', function() {

    });  

    after(function() {
        // Close Postgres connection
        sequelize.close();
    });
});
