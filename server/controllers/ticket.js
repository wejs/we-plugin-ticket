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
    if (!res.locals.data)
      return res.notFound('user.ticket.findOne.not.found');

    return res.ok();
  },
  edit: function edit(req, res) {
    if (!req.isAuthenticated())
      return res.forbidden('user.ticket.edit.not.authenticated');

    if (!res.locals.template)
      res.locals.template = res.local.model + '/' + 'edit';

    var record = res.locals.data;

    // only update fullName in edit ticket
    var newData = {
      fullName: req.body.fullName,
      displayName: req.body.displayName
    };

    if (req.we.config.updateMethods.indexOf(req.method) > -1) {
      if (!record) return res.notFound();

      record.updateAttributes(newData)
      .then(function() {
        res.locals.data = record;
        return res.updated();
      }).catch(res.queryError);
    } else {
      res.ok();
    }
  }
};