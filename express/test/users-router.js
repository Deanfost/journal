var { sequelize, User } = require('../models');
var jwt = require('jsonwebtoken');
var jwtSecret = process.env.JWT_SECRET;
var chai = require('chai');
var chaiHttp = require('chai-http');
var bcrypt = require('bcrypt');
var expect = chai.expect;
var server = require('../app');

chai.use(chaiHttp);

describe('Users Router', function() {
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

    describe('GET /', function() {
        it('should get all 4 registered usernames', function(done) {
            chai.request(server)
            .get('/users')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal([
                    {username: 'dean1'},
                    {username: 'dean2'},
                    {username: 'dean3'},
                    {username: 'dean4'}
                ]);
                done();
            });
        });

        it('should get no usernames', function(done) {
            User.destroy({
                truncate: true
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
        it('should return 400 if missing query param', function(done) {
            chai.request(server)
            .del('/users')
            .query({someotherparam: 'adl.jg'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
        });

        it('should return 400 if query param is empty', function(done) {
            chai.request(server)
            .del('/users')
            .query({username: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
        });

        it('should return 401 if not authenticated with JWT', function(done) {
            chai.request(server)
            .del('/users')
            .query({username: 'dean1'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                expect(res.text).to.deep.equal('Invalid token');
                done();
            });
        });

        it('should return 403 if not own user', function(done) {
            const token = jwt.sign({username:'dean1'}, jwtSecret);
            chai.request(server)
            .del('/users')
            .query({username:'dean2'})
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(403);
                expect(res.text).to.deep.equal('Cannot delete a different user');
                done();
            });
        });

        it('should return 404 if no user found', function(done) {
            const token = jwt.sign({username:'i do not exist'}, jwtSecret);
            chai.request(server)
            .del('/users')
            .query({username: 'i do not exist'})
            .set('Authorization', 'Bearer ' + token)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(404);
                expect(res.text).to.deep.equal('User not found');
                done();
            });
        });

        it('should delete the correct user', function(done) {
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
                        {username: 'dean2'},
                        {username: 'dean3'},
                        {username: 'dean4'}
                    ]);
                    done();
                });
            });
        }); 
    });

    describe('POST /signup', function() {
        it('should return 400 if missing any body params', function(done) {
            var completed = 0;
            chai.request(server)
            .post('/users/signup')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == 3) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: 'adg'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == 3) done();
            });
            
            chai.request(server)
            .post('/users/signup')
            .send({password: 'adga'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == 3) done();
            });
        });

        it('should return 400 if any body params are empty', function(done) {
            var completed = 0;
            chai.request(server)
            .post('/users/signup')
            .send({username: '', password: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == 4) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: 'adgsa', password: ''})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == 4) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: '', password: 'adga'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                completed += 1;
                if (completed == 4) done();
            });

            chai.request(server)
            .post('/users/signup')
            .send({username: 'adg', password: 'adga'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                completed += 1;
                if (completed == 4) done();
            });
        });

        it('should return 409 if duplicate username', function(done) {
            chai.request(server)
            .post('/users/signup')
            .send({username: 'dean1', password: '1234'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(409);
                expect(res.text).to.deep.equal('Username already exists');
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
                        {username: 'dean1'},
                        {username: 'dean2'},
                        {username: 'dean3'},
                        {username: 'dean4'},
                        {username: 'not dean'}
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

        it('should return a JWT that expires at the correct time', function(done) {
            const timestamp = Math.floor(new Date().getTime() / 1000);
            const projectedExp = timestamp + process.env.JWT_DELTA_MINUTES * 60;
            chai.request(server)
            .post('/users/signup')
            .send({username: 'not dean', password: '1234'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                const exp = jwt.verify(res.text, jwtSecret).exp;
                expect(exp >= projectedExp && exp <= projectedExp + 1).to.be.true;
                done();
            });
        }); 
    });   

    describe('GET /signin', function() {
        // TODO make sure to check if the token is valid(signature, exp)
    });  

    after(function() {
        // Close Postgres connection
        sequelize.close();
    });
});
