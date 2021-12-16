var { sequelize, User, Note } = require('../models');
var jwt = require('jsonwebtoken');
var jwtSecret = process.env.JWT_SECRET;
var chai = require('chai');
var chaiHttp = require('chai-http');
var bcrypt = require('bcrypt');
var expect = chai.expect;
var server = require('../app');

chai.use(chaiHttp);

describe.only('Entries Router', function() {
    const date = '2021-03-14';
    beforeEach(async function() {
        // Reset table state before each test
        await sequelize.queryInterface.dropAllTables();
        await sequelize.sync();

        var salt = await bcrypt.genSalt();
        var digest = await bcrypt.hash('1234', salt);
        await User.create({username: 'dean1', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('12', salt);
        await User.create({username: 'dean2', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('34', salt);
        await User.create({username: 'dean3', password: digest});

        await sequelize.queryInterface.bulkInsert('Notes', [
            {
                title: 'dean1 note 1', 
                content: 'This is content', 
                createdAt: date, 
                updatedAt: date, 
                username: 'dean1'
            },
            {
                title: 'dean1 note 2', 
                content: '', 
                createdAt: date, 
                updatedAt: date, 
                username: 'dean1'
            },
            {
                title: 'dean2 note 1', 
                content: 'This is content', 
                createdAt: date, 
                updatedAt: date, 
                username: 'dean2'
            },
            {
                title: 'dean2 note 2', 
                content: '', 
                createdAt: date, 
                updatedAt: date, 
                username: 'dean2'
            },
            {
                title: 'dean2 note 3', 
                content: 'Hello there', 
                createdAt: date, 
                updatedAt: date, 
                username: 'dean2'
            },
        ]);
    });

    describe('GET /', function() {
        it('should return 401 if not authenticated with JWT', function(done) {
            chai.request(server)
            .get('/entries')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                expect(res.text).to.deep.equal('Invalid token');
                done();
            });
        });

        it('should return 400 if current user not found', function(done) {
            const token = jwt.sign({username:'i do not exist'}, jwtSecret);
            chai.request(server)
            .get('/entries')
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                expect(res.text).to.deep.equal('Current user does not exist');
                done();
            });
        });

        it('should return 3 entries', function(done) {
            const token = jwt.sign({username:'dean2'}, jwtSecret);
            chai.request(server)
            .get('/entries')
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal({
                    count: 3,
                    user: 'dean2',
                    entries: [
                        {id: 3, title: 'dean2 note 1', updatedAt: '2021-03-14T00:00:00.000Z'},
                        {id: 4, title: 'dean2 note 2', updatedAt: '2021-03-14T00:00:00.000Z'},
                        {id: 5, title: 'dean2 note 3', updatedAt: '2021-03-14T00:00:00.000Z'},
                    ]
                });
                done();
            });
        });

        it('should return 0 entries', function(done) {
            const token = jwt.sign({username:'dean3'}, jwtSecret);
            chai.request(server)
            .get('/entries')
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal({
                    count: 0,
                    user: 'dean3',
                    entries: []
                });
                done();
            });
        });
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
