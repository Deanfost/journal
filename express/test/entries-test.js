var { sequelize, User, Note } = require('../models');
var jwt = require('jsonwebtoken');
var jwtSecret = process.env.JWT_SECRET;
var chai = require('chai');
var chaiHttp = require('chai-http');
var bcrypt = require('bcrypt');
var expect = chai.expect;
var server = require('../app');

chai.use(chaiHttp);

describe('Entries Router', function() {
    beforeEach(async function() {
        // Reset table state before each test
        await User.destroy({
            truncate: {cascade: true}
        });

        var salt = await bcrypt.genSalt();
        var digest = await bcrypt.hash('1234', salt);
        const user1 = await User.create({username: 'dean1', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('12', salt);
        const user2 = await User.create({username: 'dean2', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('34', salt);
        await User.create({username: 'dean3', password: digest});

        await user1.createNote({
            title: 'dean1 note 1',
            content: 'This is content',
        });
        await user1.createNote({
            title: 'dean1 note 2',
            content: '',
        });

        await user2.createNote({
            title: 'dean2 note 1', 
            content: 'This is content'
        });
        await user2.createNote({
            title: 'dean2 note 2', 
            content: ''
        });
        await user2.createNote({
            title: 'dean2 note 3', 
            content: 'Hello there'
        });
    });

    describe.skip('GET /', function() {

    });

    describe.skip('POST /', function() {

    });

    describe.skip('GET /:entryid', function() {

    });

    describe.skip('PUT /:entryid', function() {

    });

    describe.skip('DELETE /:entryid', function() {

    });

    after(async function() {
        await sequelize.close();
    });
});
