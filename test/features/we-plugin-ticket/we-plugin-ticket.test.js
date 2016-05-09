var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http;
var we;
var agent;
var ticketAPI;

var stubData = {
  title: 'NodeConf BR',
  typeName: 'Primeiro lote',
  typeIdentifier: 'event-ticket-1',
  date: new Date((new Date()).getTime() + (10 * 86400000)),
  fullName: 'Alberto Souza',
  ownerId: null, // set bellow
  location: 'Rio de Janeiro, deus me livre, rua X numero 20'
};

describe('we-plugin-ticketFeature', function() {
  var salvedUser, salvedUserPassword, authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();

    ticketAPI = we.plugins['we-plugin-ticket'].api;

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function (err, user) {
      if (err) throw err;

      stubData.ownerId = user.id;

      salvedUser = user;
      salvedUserPassword = userStub.password;

      // login user and save the browser
      authenticatedRequest = request.agent(http);
      authenticatedRequest.post('/login')
      .set('Accept', 'application/json')
      .send({
        email: salvedUser.email,
        password: salvedUserPassword
      })
      .expect(200)
      .set('Accept', 'application/json')
      .end(function (err) {
        done(err);
      });
    })
  });

  describe('Bootstrap', function () {
    it ('app should load ticket API in bootstrap', function (done) {
      assert(we.plugins['we-plugin-ticket'].api);
      done();
    });

    it ('app should throw error if not find the we in bootstrap', function (done) {
      var a;
      try {
        a = new we.plugins['we-plugin-ticket'].SDK({});
      } catch(e) {
        assert(!a);

        if (e.toString() != 'Error: config.we is required for tickets SDK') {
          throw e;
        }

        assert.equal(e.toString(), 'Error: config.we is required for tickets SDK');
        done();
      }
    });
  });

  describe('ticketModel', function(){
    it ('should return ticket.error.required.ownerId error on create if not find the ownerId', function(done){
      var stub = we.utils._.clone(stubData);

      stub.ownerId = null;

      we.db.models.ticket.create(stub)
      .then(function(){
        done('need to returns error');
      }).catch(function (err){

        assert.equal(err.message, 'ticket.error.required.ownerId');

        done();
      })

    });
  });

  describe('plugin.addMyTicketsLink', function(){
    it ('should skip if user not is authenticated', function(done){
      var called = false;
      var data = {
        req: {
          isAuthenticated: function() { return false; },
        },
        res: {
          locals: {
            userMenu: {
              addLink: function() {
                called = true;
              }
            }
          }
        }
      };

      we.plugins['we-plugin-ticket'].addMyTicketsLink(data, function(){
        assert(!called);
        done();
      });
    });

    it ('should set tickets link in user menu', function(done){
      var called = false;
      var data = {
        req: {
          isAuthenticated: function() { return true; },
          user: { id: 11 },
          __: we.i18n.__
        },
        res: {
          locals: {
            userMenu: {
              addLink: function(link) {
                assert(link);
                assert.equal(link.id, 'user-tickets-find');
                assert.equal(link.href, '/user/11/ticket');

                called = true;
              }
            }
          }
        }
      };

      we.plugins['we-plugin-ticket'].addMyTicketsLink(data, function(){
        assert(called);
        done();
      });

    });
  });

  describe('ticketLogModel', function(){
    it ('should return ticketLog.error.required.actorId error on create if not find the actorId', function(done){
      we.db.models.ticketLog.create({
        text: 'asdasdasd'
      })
      .then(function(){
        done('need to returns error');
      }).catch(function (err){

        assert.equal(err.message, 'ticketLog.error.required.actorId');

        done();
      })

    });

    it ('should return ticketLog.error.required.ticketId error on create if not find the ticketId', function(done){
      we.db.models.ticketLog.create({
        text: 'asdasdasd',
        actorId: 10
      })
      .then(function(){
        done('need to returns error');
      }).catch(function (err){

        assert.equal(err.message, 'ticketLog.error.required.ticketId');

        done();
      })

    });
  })


  describe('we.plugins[\'we-plugin-ticket\'].api', function () {
    describe('createTicket', function() {
      it ('createTicket should create one ticket with valid data', function (done) {
        // - Create new ticket to user 1
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert(salvedTicket);
          assert.equal(salvedTicket.status, 'valid');

          we.db.models.ticket.findOne({ where: { id: salvedTicket.id } })
          .then(function(t){
            assert(t);

            assert.equal(t.id, salvedTicket.id);
            assert.equal(t.title, salvedTicket.title);
            assert.equal(t.fullName, salvedTicket.fullName);

            done();
          }).catch(done);
        });

      });
    });

    describe('checkIn', function() {
      it ('checkIn should change the checkIn status with valid data', function (done) {
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert.equal(salvedTicket.status, 'valid');

          ticketAPI.checkIn(salvedTicket.id, 10, function (err, record) {
            if (err) throw err;

            assert(record);
            assert.equal(record.id, salvedTicket.id);
            assert(record.checkIn);

            done();
          });
        });
      });

      it ('checkIn should return error ticket.not.found if not find the record', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve();
          });
        }

        ticketAPI.checkIn(1, 10, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.found');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('checkIn should return error ticket.not.valid if status is invalid', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({id: 1, status: 'invalid'});
          });
        }

        ticketAPI.checkIn(1, 10, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.valid');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('checkIn should return error ticket.status.are.used if status is used', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({id: 1, status: 'used'});
          });
        }

        ticketAPI.checkIn(1, 10, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.status.are.used');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });
    });

    describe('useTicket', function() {
      it ('useTicket should change to used status with valid data', function (done) {
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert.equal(salvedTicket.status, 'valid');

          ticketAPI.checkIn(salvedTicket.id, 10, function (err) {
            if (err) throw err;

            ticketAPI.useTicket(salvedTicket.id, 10, function (err, record) {
              if (err) throw err;

              assert(record);
              assert.equal(record.id, salvedTicket.id);
              assert.equal(record.status, 'used');

              done();
            });
          });
        });
      });

      it ('useTicket should return error ticket.not.found if not find the record', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve();
          });
        }

        ticketAPI.useTicket(1, 10, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.found');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('useTicket should return error ticket.not.found if not find the record', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve();
          });
        }

        ticketAPI.useTicket(1, 10, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.found');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('useTicket should return error ticket.not.valid if status is invalid', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({ id: 1, status: 'invalid' });
          });
        }

        ticketAPI.useTicket(1, 10, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.valid');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });
      it ('useTicket should return skip update if status is used', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({ id: 1, status: 'used' });
          });
        }

        ticketAPI.useTicket(1, 10, function (err, record) {
          if (err) throw err;

          assert(record);
          assert.equal(record.status, 'used');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

    });
    describe('getLogs', function() {

      var salvedTicket;
      var logTexts = [
        'ticket.log.created',
        'Testing ticket log 1',
        'Testing ticket log 2',
        'Testing ticket log 3'
      ];

      before(function (done){
        ticketAPI.createTicket(stubData, function (err, r) {
          if (err) return done(err);
          salvedTicket = r;
          done();
        });
      });

      it ('getLogs should return all logs from one ticket', function (done) {

        we.utils.async.series([
          function(done) {
            ticketAPI.addLog(salvedTicket.id, salvedUser.id, {
              text: logTexts[1]
            }, done);
          },
          function(done) {
            ticketAPI.addLog(salvedTicket.id, salvedUser.id, {
              text: logTexts[2]
            }, done);
          },
          function(done) {
            ticketAPI.addLog(salvedTicket.id, salvedUser.id, {
              text: logTexts[3]
            }, done);
          },

          function(done) {
            ticketAPI.getLogs(salvedTicket.id, function (err, logs){
              if (err) return done(err);
              assert(logs);

              assert.equal(logs.length, 4);

              logs.forEach(function(l) {
                assert(logTexts.indexOf(l.text) > -1);
              });

              done();
            })
          }
        ], done);
      });

    });
  });
});