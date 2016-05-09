/**
 * Ticket SDK
 *
 * SDK for integrate we.js tickets plugin with others plugins
 */

function SDK(config) {
  if (!config || !config.we) throw new Error('config.we is required for tickets SDK');
  this.we = config.we;
}

SDK.prototype.createTicket = function createTicket(data, cb) {
  var self = this;

  data.status = 'valid';

  return this.we.db.models.ticket.create(data)
  .then(function afterCreate(record) {
    // save the qrcode after creta
    record.qrcode = record.getQRCode('svg');
    return record.save();
  })
  .then(function addLogInRecord(record) {
    // add the first log
    return self.addLog(record.id, record.ownerId, {
      text: self.we.i18n.__('ticket.log.created')
    }, function (log){
      record.logs = [log];
      cb(null, record);
    })
  }).catch(cb)
}

SDK.prototype.checkIn = function checkIn(ticketId, actorId, cb) {
  var self = this;

  return this.we.db.models.ticket.findOne({
    where: { id: ticketId },
    attributes: ['id', 'status']
  })
  .then(function afterLoad(record) {
    if (!record) return cb('ticket.not.found');

    if (record.status == 'invalid') return cb('ticket.not.valid');
    if (record.status == 'used') return cb('ticket.status.are.used');

    record.checkIn = true;

    return record.save()
    .then(function() {
      // log it
      return self.addLog(record.id, actorId, {
        text: self.we.i18n.__('ticket.log.check.in')
      }, function afterAddLog(log){
        record.logs = [log];
        cb(null, record);
      });
    })
  }).catch(cb);
}

SDK.prototype.useTicket = function useTicket(ticketId, actorId, cb) {
  var self = this;

  this.we.db.models.ticket.findOne({
    where: { id: ticketId },
    attributes: ['id', 'status']
  }).then(function afterLoad(record) {
    if (!record) return cb('ticket.not.found');
    // skip if already is used
    if (record.status == 'used') return cb(null, record);
    if (record.status == 'invalid') return cb('ticket.not.valid');

    record.status = 'used';

    return record.save()
    .then(function afterUpdate() {
      // log it
      return self.addLog(record.id, actorId, {
        text: self.we.i18n.__('ticket.log.use.ticket')
      }, function afterAddLog(log){
        record.logs = [log];
        cb(null, record);
      });
    });
  }).catch(cb);
}

/**
 * Add one log in ticket
 *
 * @param {Number}   ticketId
 * @param {Number}   actorId
 * @param {Object}   log      text and aditionalData
 * @param {Function} cb       run callback with err, logRecord
 */
SDK.prototype.addLog = function addLog(ticketId, actorId, log, cb) {
  return this.we.db.models.ticketLog.create({
    ticketId: ticketId,
    actorId: actorId,
    text: log.text,
    additionalData: log.additionalData
  }).then(function afterAddLog(logRecord) {
    cb(null, logRecord);
  }).catch(cb);
}

/**
 * Get all Logs from one ticket
 *
 * @param {Number}   ticketId
 * @param {Function} cb       run callback with err, records
 */
SDK.prototype.getLogs = function getLogs(ticketId, cb) {
  return this.we.db.models.ticketLog.findAll({
    where: { ticketId: ticketId }
  }).then(function afterFindAll(logs) {
    cb(null, logs);
  }).catch(cb);
}

module.exports = SDK;