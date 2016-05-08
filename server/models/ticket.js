/**
 * Ticket model
 *
 * @module      :: Model
 * @description :: ticket model
 *
 */

var qr = require('qr-image');

module.exports = function (we) {
  var model = {
    definition: {
      id: {
        type: we.db.Sequelize.INTEGER(11).ZEROFILL,
        autoIncrement: true,
        unique: true,
        primaryKey: true
      },

      idFilled: {
        type: we.db.Sequelize.VIRTUAL,
        get: function() {
          var id = this.getDataValue('id');
          var width = 11;

          width -= id.toString().length;

          if ( width > 0 ) {
            return new Array( width + (/\./.test( id ) ? 2 : 1) ).join( '0' ) + id;
          }
          return id + '';
        }
      },

      typeName: {
        type: we.db.Sequelize.STRING,
        formFieldType: null, // hide from form
        allowNull: false
      },
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
      fullName: {
        type: we.db.Sequelize.TEXT,
        formFieldType: 'text',
        allowNull: false
      },
      location: {
        type: we.db.Sequelize.STRING(1500),
        allowNull: false
      },
      // reserved, valid, closed
      status: {
        type: we.db.Sequelize.STRING(10),
        formFieldType: null, // hide from form
        defaultValue: 'reserved'
      },
      checkIn: {
        type: we.db.Sequelize.BOOLEAN,
        formFieldType: null,
        defaultValue: false
      },
      qrcode: {
        type: we.db.Sequelize.TEXT,
        skipSanitizer: true,
        formFieldType: null
      },
      eventUrl: {
        type: we.db.Sequelize.STRING(1500)
      },
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
      instanceMethods: {
        getQRCode: function getQRCode(type) {
          var qrID = we.config.hostname+'/user/'+this.ownerId+'/ticket/'+this.idFilled;
          return qr.imageSync(qrID, {
            type: (type || 'png'),
            margin: 0
          });
        }
      },
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