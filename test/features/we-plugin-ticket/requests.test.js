var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http;
var we;
var agent;

function ticketStub(user) {
  return  {
    title: 'NodeConf BR',
    typeName: 'Primeiro lote',
    typeIdentifier: 'event-ticket-1',
    date: new Date((new Date()).getTime() + (10 * 86400000)),
    fullName: 'Alberto Souza',
    ownerId: user.id, // set bellow
    location: 'Rio de Janeiro, deus me livre, rua X numero 20'
  };
}

describe('tickets_requests', function() {
  var salvedUser, salvedUserPassword, authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);
    we = helpers.getWe();
    we.config.acl.disabled = true;

    we.utils.async.series([
      function createAuthenticatedUser(done) {
        var userStub = stubs.userStub();
        helpers.createUser(userStub, function(err, user) {
          if (err) throw err;
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
          .end(done);
        });
      }
    ], done);
  });

  describe('CRUD', function() {
    beforeEach(function beforeaEach(done) {
      // delete all tickets after every CRUD test
      we.db.models.ticket.truncate()
      .then(function(){
        done();
      }).catch(done);
    });

    describe('get /user/:userId/ticket', function() {
      it ('it should return tickets list', function (done) {
        var stubs = [
          ticketStub(salvedUser),
          ticketStub(salvedUser),
          ticketStub(salvedUser)
        ];

        var oldTicket = ticketStub(salvedUser);
        oldTicket.date = new Date((new Date()).getTime() - (10 * 86400000));

        stubs.push(oldTicket);

        we.db.models.ticket.bulkCreate(stubs)
        .spread(function afterCreate() {

          authenticatedRequest
          .get('/user/'+salvedUser.id+'/ticket')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.ticket);
            assert.equal(res.body.ticket.length, 3);

            var tickets = res.body.ticket;

            var currentTimeStamp = new Date().getTime();

            for (var i = tickets.length - 1; i >= 0; i--) {
              assert.equal(salvedUser.id, tickets[i].ownerId);
              // only get next events
              assert(new Date(tickets[i].date).getTime() > currentTimeStamp);
            }

            done();
          });
        }).catch(done);
      });

      it ('it should return old events tickets list with old=true', function (done) {
        var stubs = [
          ticketStub(salvedUser),
          ticketStub(salvedUser),
          ticketStub(salvedUser)
        ];

        var oldTicket = ticketStub(salvedUser);
        oldTicket.date = new Date((new Date()).getTime() - (10 * 86400000));

        stubs.push(oldTicket);

        we.db.models.ticket.bulkCreate(stubs)
        .spread(function afterCreate() {

          authenticatedRequest
          .get('/user/'+salvedUser.id+'/ticket?old=true')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.ticket);
            assert.equal(res.body.ticket.length, 1);

            var tickets = res.body.ticket;

            var currentTimeStamp = new Date().getTime();

            for (var i = tickets.length - 1; i >= 0; i--) {
              assert.equal(salvedUser.id, tickets[i].ownerId);
              // only get next events
              assert(new Date(tickets[i].date).getTime() < currentTimeStamp);
            }

            done();
          });
        }).catch(done);
      });

      it ('it should return 403 if user not is authenticated', function (done) {

        request(http)
        .get('/user/'+salvedUser.id+'/ticket')
        .set('Accept', 'application/json')
        .expect(403)
        .end(function (err, res) {
          if (err) throw err;

          assert.equal(res.body.messages[0].message, 'user.ticket.find.not.authenticated');

          done();
        });
      });
    });

    describe('get /user/:userId/ticket/:ticketId', function() {

      it ('it should return 403 if user not is authenticated', function (done) {
        request(http)
        .get('/user/'+salvedUser.id+'/ticket/1')
        .set('Accept', 'application/json')
        .expect(403)
        .end(function (err, res) {
          if (err) throw err;

          assert.equal(res.body.messages[0].message, 'user.ticket.find.not.authenticated');

          done();
        });
      });
      it ('it should return 404 if not found the ticket', function (done) {
        authenticatedRequest
        .get('/user/'+salvedUser.id+'/ticket/13adsd2313131133113311331')
        .set('Accept', 'application/json')
        .expect(404)
        .end(function (err, res) {
          if (err) throw err;

          assert.equal(res.body.messages[0].message, 'user.ticket.findOne.not.found');

          done();
        });
      });

      it ('it should return the record', function (done) {

        we.db.models.ticket.create(ticketStub(salvedUser))
        .then(function (r){

          authenticatedRequest
          .get('/user/'+salvedUser.id+'/ticket/'+r.id)
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.ticket);
            assert.equal(res.body.ticket.id, r.id);

            done();
          });
        }).catch(done);
      });
    });

    describe('get /user/:userId/ticket/:ticketId/edit', function() {
      it ('it should return the edit form');

      it ('it should return 403 if user not is authenticated', function (done) {
        request(http)
        .post('/user/'+salvedUser.id+'/ticket/1/edit')
        .set('Accept', 'application/json')
        .expect(403)
        .end(function (err, res) {
          if (err) throw err;

          assert.equal(res.body.messages[0].message, 'user.ticket.edit.not.authenticated');

          done();
        });
      });

      it ('it should update only ticket fullName', function (done) {

        we.db.models.ticket.create(ticketStub(salvedUser))
        .then(function (r){

          var newData = {
            fullName: 'aaa aa a aaaa',
            ownerId: 1231231,
            title: 'aaaaaa'
          }

          authenticatedRequest
          .post('/user/'+salvedUser.id+'/ticket/'+r.id+'/edit')
          .set('Accept', 'application/json')
          .send(newData)
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.ticket);
            assert.equal(res.body.ticket.id, r.id);

            assert.equal(res.body.ticket.fullName, newData.fullName);

            assert.equal(res.body.ticket.ownerId, r.ownerId);
            assert.equal(res.body.ticket.title, r.title);

            done();
          });
        }).catch(done);
      });

      it ('it should redirect to ticket url after update with html reponse', function (done) {

        we.db.models.ticket.create(ticketStub(salvedUser))
        .then(function(r) {

          var newData = {
            fullName: 'aaa aa a aaaa',
            ownerId: 1231231,
            title: 'aaaaaa'
          }

          authenticatedRequest
          .post('/user/'+salvedUser.id+'/ticket/'+r.id+'/edit')
          .send(newData)
          .expect(302)
          .end(function (err, res) {
            if (err) throw err;

            assert.equal(res.header.location, '/user/'+salvedUser.id+'/ticket/'+r.idFilled);

            done();
          });
        }).catch(done);
      });
    });

    describe('get /user/:userId/ticket/:ticketId/download.pdf', function() {
      it ('it should return 404 if not found the ticket', function (done) {
        we.db.models.ticket.create(ticketStub(salvedUser))
          .then(function (r){

          authenticatedRequest
          .get('/user/'+salvedUser.id+'/ticket/a3131311312/download.pdf')
          .set('Accept', 'application/json')
          .expect(404)
          .end(function (err, res) {
            if (err) throw err;

            assert.equal(res.body.messages[0].message, 'user.ticket.download.not.found');

            done();
          });
        });
      });

      it ('it should return create the pdf file and send to browser', function (done) {
        we.db.models.ticket.create(ticketStub(salvedUser))
        .then(function (r){

          authenticatedRequest
          .get('/user/'+salvedUser.id+'/ticket/'+r.id+'/download.pdf')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.text);

            done();
          });
        }).catch(done);
      });
    });

  });
});
