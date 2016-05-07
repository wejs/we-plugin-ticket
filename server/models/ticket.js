/**
 * Ticket model
 *
 * @module      :: Model
 * @description :: ticket model
 *
 */

module.exports = function (we) {
  var model = {
    definition: {
      typeIdentifier: {
        type: we.db.Sequelize.STRING,
        formFieldType: null, // hide from form
        allowNull: false
      },
      // use title for event or course name
      title: {
        type: we.db.Sequelize.STRING(1500),
        allowNull: false
      },
      date: {
        type: we.db.Sequelize.DATE,
        allowNull: false
      },

      displayName: {
        type: we.db.Sequelize.TEXT,
        formFieldType: 'text',
        allowNull: false
      },
      fullName: {
        type: we.db.Sequelize.TEXT,
        formFieldType: 'text',
        allowNull: false
      },

      email: {
        type: we.db.Sequelize.STRING(1000),
        formFieldType: 'email',
        allowNull: false,
        isEmail: true
      },

      location: {
        type: we.db.Sequelize.STRING(1500),
        allowNull: false
      },
      // reserved, valid, checkIn, closed
      status: {
        type: we.db.Sequelize.STRING(10),
        formFieldType: null, // hide from form
        defaultValue: 'reserved'
      }
    },
    associations: {
      owner: {
        type: 'belongsTo',
        model: 'user',
        required: true
      }
    },
    options: {
      titleField: 'title',

      classMethods: {},
      instanceMethods: {},
      hooks: {
        beforeCreate: function beforeCreate(record, opts, done) {
          if (!record.ownerId) return done('ticket.error.required.ownerId');
          if (!record.status) record.status = 'reserved';
          done();
        }
      }
    }
  };

  return model;
};