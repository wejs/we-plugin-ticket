/**
 * Ticket log
 *
 * @module      :: Model
 * @description :: Ticket log model
 *
 */

module.exports = function (we) {
  var model = {
    definition: {
      text: {
        type: we.db.Sequelize.STRING(500),
        allowNull: false
      },
      additionalData: {
        type: we.db.Sequelize.BLOB
      }
    },
    associations: {
      actor: { type: 'belongsTo', model: 'user' },
      ticket: { type: 'belongsTo', model: 'ticket' }
    },
    options: {
      classMethods: {},
      instanceMethods: {},
      hooks: {
        beforeCreate: function beforeCreate(record, opts, done) {
          if (!record.actorId) return done('ticketLog.error.required.actorId');
          if (!record.ticketId) return done('ticketLog.error.required.ticketId');
          done();
        }
      }
    }
  };

  return model;
};