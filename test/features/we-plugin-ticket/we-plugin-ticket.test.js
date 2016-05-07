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
  ticketTypeName: 'Primeiro lote',
  typeIdentifier: 'event-ticket-1',
  date: new Date((new Date()).getTime() + (10 * 86400000)),
  displayName: 'Afro Samuray',
  fullName: 'Alberto Souza',
  email: 'contato@albertosouza.net',
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
    helpers.createUser(userStub, function(err, user) {
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

  describe('we.plugins[\'we-plugin-ticket\'].api', function () {
    describe('createTicket', function() {
      it ('createTicket should create one ticket with valid data', function (done) {
        // - Create new ticket to user 1
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert(salvedTicket);
          assert.equal(salvedTicket.status, 'reserved');

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

    describe('validTicket', function() {
      it ('validTicket should create one ticket with valid data', function (done) {
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert.equal(salvedTicket.status, 'reserved');

          ticketAPI.validTicket(salvedTicket.id, function (err, record) {
            if (err) throw err;

            assert(record);
            assert.equal(record.id, salvedTicket.id);
            assert.equal(record.status, 'valid');

            done();
          });
        });
      });

      it ('validTicket should return error if not find the record', function (done) {
        ticketAPI.validTicket(46545654646, function (err, record) {
          assert(!record);

          assert.equal(err, 'ticket.not.found');

          done();
        });
      });

      it ('validTicket should skip update the ticket status if not is reserverd', function (done) {
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert.equal(salvedTicket.status, 'reserved');

          ticketAPI.validTicket(salvedTicket.id, function (err, record) {
            if (err) throw err;

            assert(record);
            assert.equal(record.id, salvedTicket.id);
            assert.equal(record.status, 'valid');

            ticketAPI.validTicket(salvedTicket.id, function (err, record) {
              if (err) throw err;

              assert(record);
              assert.equal(record.id, salvedTicket.id);
              assert.equal(record.status, 'valid');

              done();
            });
          });
        });
      });
    });

    describe('checkIn', function() {
      it ('checkIn should change the checkIn status with valid data', function (done) {
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert.equal(salvedTicket.status, 'reserved');

          ticketAPI.validTicket(salvedTicket.id, function (err) {
            if (err) throw err;

            ticketAPI.checkIn(salvedTicket.id, function (err, record) {
              if (err) throw err;

              assert(record);
              assert.equal(record.id, salvedTicket.id);
              assert.equal(record.status, 'checkIn');

              done();
            });
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

        ticketAPI.checkIn(1, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.found');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('checkIn should return error ticket.not.valid if status is reserved', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({id: 1, status: 'reserved'});
          });
        }

        ticketAPI.checkIn(1, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.valid');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('checkIn should return error ticket.status.are.checkIn if status is checkIn', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({id: 1, status: 'checkIn'});
          });
        }

        ticketAPI.checkIn(1, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.status.are.checkIn');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('checkIn should return error ticket.status.are.closed if status is closed', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({id: 1, status: 'closed'});
          });
        }

        ticketAPI.checkIn(1, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.status.are.closed');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });
    });

    describe('closeTicket', function() {
      it ('closeTicket should change to closed status with valid data', function (done) {
        ticketAPI.createTicket(stubData, function (err, salvedTicket) {
          if (err) throw err;

          assert.equal(salvedTicket.status, 'reserved');

          ticketAPI.validTicket(salvedTicket.id, function (err) {
            if (err) throw err;

            ticketAPI.checkIn(salvedTicket.id, function (err) {
              if (err) throw err;

              ticketAPI.closeTicket(salvedTicket.id, function (err, record) {
                if (err) throw err;

                assert(record);
                assert.equal(record.id, salvedTicket.id);
                assert.equal(record.status, 'closed');

                done();

              });
            });
          });
        });
      });

      it ('closeTicket should return error ticket.not.found if not find the record', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve();
          });
        }

        ticketAPI.closeTicket(1, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.found');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('closeTicket should return error ticket.not.found if not find the record', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve();
          });
        }

        ticketAPI.closeTicket(1, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.found');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('closeTicket should return error ticket.not.valid if status is reserved', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({ id: 1, status: 'reserved' });
          });
        }

        ticketAPI.closeTicket(1, function (err, record) {
          assert(!record);
          assert.equal(err, 'ticket.not.valid');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

      it ('closeTicket should return skip update if status is closed', function (done) {

        var findOne = we.db.models.ticket.findOne;
        we.db.models.ticket.findOne = function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve({ id: 1, status: 'closed' });
          });
        }

        ticketAPI.closeTicket(1, function (err, record) {
          if (err) throw err;

          assert(record);
          assert.equal(record.status, 'closed');

          we.db.models.ticket.findOne = findOne;

          done();
        });
      });

    });
  });

});