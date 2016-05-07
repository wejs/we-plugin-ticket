# we-plugin-ticket

[![npm version](https://badge.fury.io/js/we-plugin-ticket.svg)](https://badge.fury.io/js/we-plugin-ticket) [![Build Status](https://travis-ci.org/wejs/we-plugin-ticket.svg?branch=master)](https://travis-ci.org/wejs/we-plugin-ticket) [![Coverage Status](https://coveralls.io/repos/github/wejs/we-plugin-ticket/badge.svg?branch=master)](https://coveralls.io/github/wejs/we-plugin-ticket?branch=master)

We.js tickets plugin, add user tickets from events, courses ...",

Add all process related to generate and valid event tickets

## URLs

### Get user tickets

See in: [plugin.js](https://github.com/wejs/we-plugin-ticket/blob/master/plugin.js#L22)

## SDK

```js
var ticketAPI = we.plugins['we-plugin-ticket'].api;
// Example data
var data = {
  title: 'NodeConf BR', // required
  ticketTypeName: 'Primeiro lote',
  typeIdentifier: 'event-ticket-1', // required
  date: new Date(), // required || event, course, date for the thing how will happend
  // name to show in ticket, owner can change it
  displayName: 'Afro Samuray',
  ownerId: 1,
  // full name, owner can change it
  // this name is used in user ticket validation or special tickets checks
  fullName: 'Alberto Souza', 
  email: 'contato@albertosouza.net', // reqiured
  location: 'Rio de Janeiro, deus me livre, rua X numero 20' // event location
};

// - Create new ticket to user 1
ticketAPI.createTicket(data, function (err, salvedTicket) {
  console.log('createTicket:', err, salvedTicket.id);

  // Valid the ticket
  ticketAPI.validTicket(salvedTicket.id, function (err, record) {
    console.log('validTicket:', err, record.id);

  });

  // marck user check in
  ticketAPI.checkIn(salvedTicket.id, function (err, record) {
    console.log('checkIn:', err, record.id);
  });

  // close the ticket, all done (optional)
  ticketAPI.closeTicket(salvedTicket.id, function (err, record) {
    console.log('closeTicket:', err, record.id);
  });
});

```


## Links

> * We.js site: http://wejs.org

## NPM Info:

[![NPM](https://nodei.co/npm/we-plugin-ticket.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/we-plugin-ticket/)

## License

Under [the MIT license](https://github.com/wejs/we/blob/master/LICENSE.md)