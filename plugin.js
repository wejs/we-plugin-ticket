/**
 * Plugin.js file, set configs, routes, hooks and events here
 *
 * see http://wejs.org/docs/we/plugin
 */
module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  plugin.setConfigs({
    'find_user_ticket': {
      'group': 'ticket',
      'title': 'Find user tickets',
      'description': 'Find and find all user tickets'
    },
    'update_user_ticket': {
      'group': 'ticket',
      'title': 'Find users',
      'description': 'Find and find all users'
    },
  });

  plugin.setRoutes({
    'get /user/:userId/ticket': {
      name: 'user.ticket.find',
      controller: 'ticket',
      action: 'find',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'find_user_ticket',
      titleHandler : 'i18n',
      titleI18n: 'user.ticket.find'
    },

    'get /user/:userId/ticket/:ticketId': {
      name: 'user.ticket.findOne',
      controller: 'ticket',
      action: 'findOne',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'find_user_ticket',
      recordField: 'i18n',
      titleField: 'title'
    },
    // get ticket data with ticket ID
    'get /api/v1/ticket/valid/:ticketId': {
      name: 'user.ticket.findOne',
      controller: 'ticket',
      action: 'findOne',
      model: 'ticket',
      permission: 'verify_user_ticket',
      responseType: 'json'
    },

    'get /user/:userId/ticket/:ticketId/download.pdf': {
      name: 'user.ticket.download',
      controller: 'ticket',
      action: 'download',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'find_user_ticket',
      recordField: 'i18n',
      titleField: 'title'
    },

    // edit
    'get /user/:userId/ticket/:ticketId/edit': {
      name: 'user.ticket.edit',
      controller: 'ticket',
      action: 'edit',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'update_user_ticket',
      recordField: 'i18n',
      titleField: 'title',
      responseType: 'html' // edit only returns the form
    },
    'post /user/:userId/ticket/:ticketId/edit': {
      controller: 'ticket',
      action: 'edit',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'update_user_ticket',
      recordField: 'i18n',
      titleField: 'title'
    }
  });

  plugin.SDK = require('./lib/SDK');

  plugin.events.on('we:after:load:plugins', function (we) {
    plugin.api = new plugin.SDK({ we: we });
  });

  plugin.hooks.on('we-plugin-menu:after:set:core:menus', function(data, done) {
    if (!data.req.isAuthenticated()) return done();
    data.res.locals.userMenu.addLink({
      id: 'user-tickets-find',
      dividerAfter: true,
      text: '<span class="fa fa-ticket" aria-hidden="true"></span> '+
        data.req.__('tickets.my'),
      href: '/user/'+data.req.user.id+'/ticket',
      parent: 'user',
      class: 'user-menu-tickets-link',
      weight: 7
    });

    done();
  });

  plugin.addCss('we-plugin-ticket', {
    weight: 5, pluginName: 'we-plugin-ticket',
    path: 'files/public/we-plugin-ticket.css'
  });

  return plugin;
};