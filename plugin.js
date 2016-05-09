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


  function editBreadcrumbHandler(req, res, done) {
    if (!req.isAuthenticated() && res.locals.data) return done();

    res.locals.breadcrumb =
      '<ol class="breadcrumb">'+
        '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
        '<li><a href="/user">'+res.locals.__('user.find')+'</a></li>'+
        '<li><a href="/user/'+req.user.id+'">'+
          req.we.utils.string(req.user.displayName || '').truncate(25).s+
        '</a></li>'+
        '<li><a href="/user/'+req.user.id+'/ticket">'+res.locals.__('user.ticket.find')+
        '</a></li>'+
        '<li><a href="/user/'+req.user.id+'/ticket/'+res.locals.id+'">'+res.locals.title+
        '</a></li>'+
        '<li class="active">'+res.locals.__('edit')+'</li>'+
      '</ol>';

    done();
  }

  function findOneTitleHandler (req, res, done) {
    res.locals.title = res.locals.__('Ticket') + ' ';

    if (res.locals.data) res.locals.title += res.locals.data.id;

    done();
  }

  plugin.setRoutes({
    'get /user/:userId/ticket': {
      name: 'user.ticket.find',
      controller: 'ticket',
      action: 'find',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'find_user_ticket',
      titleHandler : 'i18n',
      titleI18n: 'user.ticket.find',
      breadcrumbHandler: function (req, res, done) {
        if (!req.isAuthenticated()) return done();

        res.locals.breadcrumb =
          '<ol class="breadcrumb">'+
            '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
            '<li><a href="/user">'+res.locals.__('user.find')+'</a></li>'+
            '<li><a href="/user/'+req.user.id+'">'+
              req.we.utils.string(req.user.displayName || '').truncate(25).s+
            '</a></li>'+
            '<li class="active">'+res.locals.title+'</li>'+
          '</ol>';
        done();
      }
    },
    'get /user/:userId/ticket/:ticketId': {
      name: 'user.ticket.findOne',
      controller: 'ticket',
      action: 'findOne',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'find_user_ticket',
      titleHandler: findOneTitleHandler,
      breadcrumbHandler: function (req, res, done) {
        if (!req.isAuthenticated() && res.locals.data) return done();

        res.locals.breadcrumb =
          '<ol class="breadcrumb">'+
            '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
            '<li><a href="/user">'+res.locals.__('user.find')+'</a></li>'+
            '<li><a href="/user/'+req.user.id+'">'+
              req.we.utils.string(req.user.displayName || '').truncate(25).s+
            '</a></li>'+
            '<li><a href="/user/'+req.user.id+'/ticket">'+res.locals.__('user.ticket.find')+
            '</a></li>'+
            '<li class="active">'+res.locals.title+'</li>'+
          '</ol>';
        done();
      }
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
      titleHandler: findOneTitleHandler
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
      titleHandler: findOneTitleHandler,
      breadcrumbHandler: editBreadcrumbHandler,
      responseType: 'html' // edit only returns the form
    },
    'post /user/:userId/ticket/:ticketId/edit': {
      controller: 'ticket',
      action: 'edit',
      model: 'ticket',
      currentUserTickets: true,
      permission: 'update_user_ticket',
      titleHandler: findOneTitleHandler,
      breadcrumbHandler: editBreadcrumbHandler,
      recordField: 'i18n',
      titleField: 'title'
    }
  });

  plugin.SDK = require('./lib/SDK');

  plugin.addMyTicketsLink = function addMyTicketsLink(data, done) {
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
  }

  plugin.events.on('we:after:load:plugins', function (we) {
    plugin.api = new plugin.SDK({ we: we });
  });

  plugin.hooks.on('we-plugin-menu:after:set:core:menus', plugin.addMyTicketsLink);

  plugin.addCss('we-plugin-ticket', {
    weight: 5, pluginName: 'we-plugin-ticket',
    path: 'files/public/we-plugin-ticket.css'
  });

  return plugin;
};