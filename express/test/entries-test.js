var { sequelize, User, Note } = require('../models');
var jwt = require('jsonwebtoken');
var jwtSecret = process.env.JWT_SECRET;
var chai = require('chai');
var chaiHttp = require('chai-http');
var chaiMatchPattern = require('chai-match-pattern');
var bcrypt = require('bcrypt');
var expect = chai.expect;
var server = require('../app');
var lm = chaiMatchPattern.getLodashModule();

chai.use(chaiHttp);
chai.use(chaiMatchPattern);

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

    describe('POST /', function() {
        it('should return 401 if not authenticated with JWT', function(done) {
            chai.request(server)
            .post('/entries')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                expect(res.text).to.deep.equal('Invalid token');
                done();
            });
        });

        it('should return 400 if missing body params', function(done) {
            var completed = 0, count = 3;
            const token = jwt.sign({username:'dean3'}, jwtSecret);
            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (count === completed) done();
            });

            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .send({title: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (count === completed) done();
            });

            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .send({content: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (count === completed) done();
            });
        });

        it('should return 400 if required body params are empty', function(done) {
            var completed = 0, count = 3;
            const token = jwt.sign({username:'dean3'}, jwtSecret);
            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .send({title: '', content: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (count === completed) done();
            });

            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .send({title: '', content: 'agas'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (count === completed) done();
            });

            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .send({title: 'adga', content: 'agas'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                completed += 1;
                if (count === completed) done();
            });
        });

        it('should return 400 if current user does not exist', function(done) {
            const token = jwt.sign({username:'i do not exist'}, jwtSecret);
            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .send({title: 'adg', content: 'agas'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
        });

        it('should create the entry', function(done) {
            const token = jwt.sign({username:'dean3'}, jwtSecret);
            chai.request(server)
            .post('/entries')
            .set('Authorization', 'Bearer ' + token)
            .send({title: 'dean3 test', content: 'content'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                expect(res.body).to.matchPattern({
                    id: 6,
                    title: 'dean3 test',
                    content: 'content', 
                    username: 'dean3',
                    createdAt: lm.isString, 
                    updatedAt: lm.isString
                });

                chai.request(server)
                .get('/entries')
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body.count).to.equal(1);
                    expect(res.body.user).to.equal('dean3');
                    expect(res.body.entries).to.be.of.length(1);
                    expect(res.body.entries[0]).to.matchPattern({
                        id: 6,
                        title: 'dean3 test',
                        updatedAt: lm.isString
                    });
                    done();
                });
            });
        });
    });

    describe.skip('GET /:entryid', function() {

    });

    describe.skip('PUT /:entryid', function() {

    });

    describe.skip('DELETE /:entryid', function() {

    });
});
