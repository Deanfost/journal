var { sequelize, User, Note } = require('../models');
var jwt = require('jsonwebtoken');
var jwtSecret = process.env.JWT_SECRET;
var chai = require('chai');
var chaiHttp = require('chai-http');
var bcrypt = require('bcrypt');
var expect = chai.expect;
var server = require('../app');
var { WrappedErrorResponse, httpMessages } = require('../util');

chai.use(chaiHttp);

describe('Users Router', function() {
    beforeEach(async function() {
        // Reset table state before each test
        await User.destroy({
            truncate: {cascade: true}
        });

        var salt = await bcrypt.genSalt();
        var digest = await bcrypt.hash('1234', salt);
        await User.create({username: 'dean1', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('12', salt);
        await User.create({username: 'dean2', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('34', salt);
        await User.create({username: 'dean3', password: digest});

        salt = await bcrypt.genSalt();
        digest = await bcrypt.hash('14', salt);
        await User.create({username: 'dean4', password: digest});
    });

    describe('GET /', function() {
        it('should get all 4 registered usernames', function(done) {
            chai.request(server)
            .get('/users')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal([
                    'dean1', 'dean2', 'dean3', 'dean4'
                ]);
                done();
            });
        });

        it('should get no usernames', function(done) {
            User.destroy({
                truncate: {cascade: true}
            }).then(() => {
                chai.request(server)
                .get('/users')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.empty;
                });
                done();
            }).catch(err => {
                console.log(err);
                done(err);
            });
        });
    });  

    describe('DELETE /', function() {
        it('should return 401 if not authenticated with JWT', function(done) {
            chai.request(server)
            .del('/users')
            .query({username: 'dean1'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                var resp = new WrappedErrorResponse(401, httpMessages.INVALID_TOKEN);
                expect(res.body).to.deep.equal(resp.toJSON());
                done();
            });
        });

        it('should return 400 if current user not found', function(done) {
            const token = jwt.sign({username:'i do not exist'}, jwtSecret);
            chai.request(server)
            .del('/users')
            .query({username: 'i do not exist'})
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                var resp = new WrappedErrorResponse(400, httpMessages.EXPIRED_USER);
                expect(res.body).to.deep.equal(resp.toJSON());
                done();
            });
        });

        it('should delete the correct user and their entries', function(done) {
            const date = '2021-03-14';
            sequelize.queryInterface.bulkInsert('Notes', [
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
                }
            ]).then(_ => {
                const token = jwt.sign({username:'dean1'}, jwtSecret);
                chai.request(server)
                .del('/users')
                .query({username: 'dean1'})
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(204);
    
                    chai.request(server)
                    .get('/users')
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal([
                            'dean2', 'dean3', 'dean4'
                        ]);
                        Note.findAll({
                            where: {
                                username: 'dean1'
                            }
                        }).then(r => {
                            expect(r).to.be.empty;
                            done();
                        }).catch(done);
                    });
                });
            }).catch(done);
        }); 
    });

    describe('POST /signup', function() {
        it('should return 400 if missing any body params', function(done) {
            var completed = 0, count = 3;
            chai.request(server)
            .post('/users/signup')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: 'adg'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });
            
            chai.request(server)
            .post('/users/signup')
            .send({password: 'adga'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });
        });

        it('should return 400 if any body params are empty', function(done) {
            var completed = 0, count = 4;
            chai.request(server)
            .post('/users/signup')
            .send({username: '', password: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: 'adgsa', password: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: '', password: 'adga'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: 'adg', password: 'adga'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                completed += 1;
                if (completed == count) done();
            });
        });

        it('should return 409 if duplicate username', function(done) {
            chai.request(server)
            .post('/users/signup')
            .send({username: 'dean1', password: '1234'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(409);
                var resp = new WrappedErrorResponse(409, httpMessages.USER_CONFLICT);
                expect(res.body).to.deep.equal(resp.toJSON());
                done();
            });
        });

        it('should create the new user', function(done) {
            chai.request(server)
            .post('/users/signup')
            .send({username: 'not dean', password: '1234'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                
                chai.request(server)
                .get('/users')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal([
                        'dean1', 'dean2', 'dean3', 'dean4', 'not dean'
                    ]);
                    done();
                });
            });
        });

        it('should return a valid JWT for the correct user', function(done) {
            chai.request(server)
            .post('/users/signup')
            .send({username: 'not dean', password: '1234'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                try {
                    const payload = jwt.verify(res.text, jwtSecret);
                    expect(payload.username).to.deep.equal('not dean');
                    done();
                } catch (err) {
                    done('JWT verification failed');
                }
            });
        });
    });   

    describe('POST /signin', function() {
        var completed = 0, count = 3;
        it('should return 400 if missing any body params', function(done) {
            chai.request(server)
            .post('/users/signin')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });

            chai.request(server)
            .post('/users/signin')
            .send({username: 'adg'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });

            chai.request(server)
            .post('/users/signin')
            .send({password: 'adg'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });
        });

        it('should return 400 if any body params are empty', function(done) {
            var completed = 0, count = 3;
            chai.request(server)
            .post('/users/signin')
            .send({username: '', password: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });

            chai.request(server)
            .post('/users/signin')
            .send({username: 'adg', password: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });
            
            chai.request(server)
            .post('/users/signin')
            .send({username: '', password: 'adg'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == count) done();
            });
        });

        it('should return 404 if user does not exist', function(done) {
            chai.request(server)
            .post('/users/signin')
            .send({username: 'i do not exist', password: '1234'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(404);
                var resp = new WrappedErrorResponse(404, httpMessages.USERNAME_NOT_FOUND);
                expect(res.body).to.deep.equal(resp.toJSON());
                done();
            });
        });

        it('should return 403 if incorrect combination', function(done) {
            chai.request(server)
            .post('/users/signin')
            .send({username: 'dean1', password: 'wrong password'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(403);
                var resp = new WrappedErrorResponse(403, httpMessages.INCORRECT_PASSWORD);
                expect(res.body).to.deep.equal(resp.toJSON());
                done();
            });
        });

        it('should return a valid JWT for the correct user', function(done) {
            chai.request(server)
            .post('/users/signin')
            .send({username: 'dean1', password: '1234'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                try {
                    const payload = jwt.verify(res.text, jwtSecret);
                    expect(payload.username).to.deep.equal('dean1');
                    done();
                } catch (err) {
                    done('JWT verification failed');
                }
            });
        });
    });  

    describe('JWT Verification Util Handler', function() {
        it('should return 401 if the token has an invalid signature', function(done) {
            const token = jwt.sign({username: 'random user'}, 'wrongsecret', {
                expiresIn: Math.floor(new Date().getTime() / 1000) + 1000
            });
            chai.request(server)
            .del('/users')
            .query({username: 'dean1'})
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                var resp = new WrappedErrorResponse(401, httpMessages.INVALID_TOKEN);
                expect(res.body).to.deep.equal(resp.toJSON());
                done();
            });
        });
    });
});
