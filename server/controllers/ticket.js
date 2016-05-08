var PDFDocument = require('pdfkit');

module.exports = {
  find: function find(req, res) {
    if (res.locals.currentUserTickets) {
      if (!req.isAuthenticated())
        return res.forbidden('user.ticket.find.not.authenticated');

      res.locals.query.where.ownerId = res.locals.user.id;
    }
    // old or new events
    if (!req.query.old) {
      res.locals.query.where.date = {
        $gte: new Date()
      }
    } else {
      res.locals.title = res.locals.__('user.ticket.find.old');
      res.locals.query.where.date = {
        $lt: new Date()
      }
    }

    res.locals.Model.findAll(res.locals.query)
    .then(function afterFind(record) {

      res.locals.data = record;

      res.locals.Model.count(res.locals.query)
      .then(function afterCount(count) {

        res.locals.metadata.count = count;
        res.ok();

      }).catch(res.queryError);
    }).catch(res.queryError);
  },
  findOne: function findOne(req, res) {
    if (!req.isAuthenticated())
      return res.forbidden('user.ticket.find.not.authenticated');
    // not preloaded, then not found
    if (
      !res.locals.data ||
      // other user ticket
      ( res.locals.currentUserTickets &&
       ( res.locals.data.ownerId != req.user.id )
      )
    ) {
      return res.notFound('user.ticket.findOne.not.found');
    }

    return res.ok();
  },
  edit: function edit(req, res) {
    if (!req.isAuthenticated())
      return res.forbidden('user.ticket.edit.not.authenticated');

    if (
      !res.locals.data ||
      // other user ticket
      ( res.locals.currentUserTickets &&
       ( res.locals.data.ownerId != req.user.id )
      )
    ) {
      return res.notFound('user.ticket.findOne.not.found');
    }

    if (!res.locals.template)
      res.locals.template = res.local.model + '/' + 'edit';

    var record = res.locals.data;

    // only update fullName in edit ticket
    var newData = {
      fullName: req.body.fullName
    };

    if (req.we.config.updateMethods.indexOf(req.method) > -1) {
      if (!record) return res.notFound();

      record.updateAttributes(newData)
      .then(function afterUpdate() {

        if (!res.locals.redirectTo) {
          res.locals.redirectTo = '/user/'+record.ownerId+'/ticket/'+record.id;
        }

        res.locals.data = record;
        res.updated();

      }).catch(res.queryError);
    } else {
      res.ok();
    }
  },

  download: function download(req, res) {
    req.we.db.models.ticket.findOne({
      where: { id: req.params.ticketId }
    }).then(function afterFind(record) {
      if (!record) return res.notFound('user.ticket.download.not.found');

      if (
        !record ||
        // other user ticket
        ( res.locals.currentUserTickets &&
          ( record.ownerId != req.user.id )
        )
      ) {
        return res.notFound('user.ticket.findOne.not.found');
      }

      var doc = new PDFDocument();
      doc.lineWidth(0.5);
      // stream to response
      doc.pipe(res);
      // QR Code
      doc.image(record.getQRCode(), 30, 30, { width: 130, height: 130 });
      // title
      doc.fontSize(15);
      doc.text(record.title, 175, 30, { width: 410 });
      // location
      doc.fontSize(10);
      doc.text(record.location, 175, 46, { width: 410, lineBreak: false });
      // ticket type name
      doc.fontSize(12);
      doc.text(record.typeName, 175, 72, { width: 410, lineBreak: false });
      // fullName
      doc.fontSize(16);
      doc.text(record.fullName, 175, 92, { width: 410 });
      // footer metadata
      var footer = record.id + ' - ' + record.typeIdentifier + ' - ' +
        res.locals.__('ticket.download.date.label')+ ' '+
        req.we.utils.moment(record.createdAt)
        .locale(res.locals.locale)
        .format('L HH:mm');
      // id / identifier
      doc.fontSize(10);
      doc.text(footer, 175, 153, { width: 410 });
      // ticket box
      doc.rect(20, 20, 570, 150)
      .stroke();
      // cutPDF line
      doc.lineWidth(1);
      doc.lineCap('butt')
        .dash(5, { space: 10 } )
        .moveTo(0, 185)
        .lineTo(650, 185)
        .stroke();
      // finalize the PDF and end the stream
      doc.end();
    }).catch(res.queryError);
  }
};