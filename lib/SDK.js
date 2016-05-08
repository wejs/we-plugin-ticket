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
  data.status = 'reserved';

  this.we.db.models.ticket.create(data)
  .then(function afterCreate(record) {
    // save the qrcode after creta
    record.qrcode = record.getQRCode('svg');
    record.save().then(function() {
      cb(null, record);
    }).catch(cb);

  }).catch(cb);
}

SDK.prototype.validTicket = function validTicket(ticketId, cb) {
  this.we.db.models.ticket.findOne({
    where: { id: ticketId },
    attributes: ['id', 'status']
  }).then(function afterLoad(record) {
    if (!record) return cb('ticket.not.found');

    if (record.status != 'reserved') {
      return cb(null, record);
    }

    record.status = 'valid';

    record.save()
    .then(function afterUpdate() {
      cb(null, record);
    }).catch(cb);
  }).catch(cb);
}

SDK.prototype.checkIn = function checkIn(ticketId, cb) {
  this.we.db.models.ticket.findOne({
    where: { id: ticketId },
    attributes: ['id', 'status']
  }).then(function afterLoad(record) {
    if (!record) return cb('ticket.not.found');

    if (record.status == 'reserved') return cb('ticket.not.valid');
    if (record.status == 'closed') return cb('ticket.status.are.closed');

    record.checkIn = true;

    record.save()
    .then(function afterUpdate() {
      cb(null, record);
    }).catch(cb);
  }).catch(cb);
}

SDK.prototype.closeTicket = function closeTicket(ticketId, cb) {
  this.we.db.models.ticket.findOne({
    where: { id: ticketId },
    attributes: ['id', 'status']
  }).then(function afterLoad(record) {
    if (!record) return cb('ticket.not.found');
    // skip if already is closed
    if (record.status == 'closed') return cb(null, record);
    if (record.status == 'reserved') return cb('ticket.not.valid');

    record.status = 'closed';

    record.save()
    .then(function afterUpdate() {
      cb(null, record);
    }).catch(cb);
  }).catch(cb);
}


module.exports = SDK;