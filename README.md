# we-plugin-ticket

[![npm version](https://badge.fury.io/js/we-plugin-ticket.svg)](https://badge.fury.io/js/we-plugin-ticket) [![Build Status](https://travis-ci.org/wejs/we-plugin-ticket.svg?branch=master)](https://travis-ci.org/wejs/we-plugin-ticket) [![Coverage Status](https://coveralls.io/repos/github/wejs/we-plugin-ticket/badge.svg?branch=master)](https://coveralls.io/github/wejs/we-plugin-ticket?branch=master)

We.js tickets plugin, add user tickets from events, courses ...",

Add SDK to process related to generate and valid event tickets

Routes to:

- Download ticket
- Edit ticket fullName
- Find and findOne user ticket with suport to owner permission
- Ticket QRCode with restricted url to ticket data

## URLs

See in: [plugin.js](https://github.com/wejs/we-plugin-ticket/blob/master/plugin.js#L51)

## SDK

```js
var ticketAPI = we.plugins['we-plugin-ticket'].api;
// Example data
var data = {
  title: 'NodeConf BR', // required
  typeName: 'Primeiro lote',
  typeIdentifier: 'ev-1-t1', // required, any string to idenfity this ticket
  date: new Date(), // required || event, course, date for the thing how will happend
  // The user how will use it, is printed, owner can change
  fullName: 'Afro Samuray',
  ownerId: 1,
  location: 'Rio de Janeiro, deus me livre, rua X numero 20' // event location
  eventUrl: '', // (optional)
};

// - Create new ticket to user 1
ticketAPI.createTicket(data, function (err, salvedTicket) {
  console.log('createTicket:', err, salvedTicket.id);

  // Valid the ticket
  ticketAPI.validTicket(salvedTicket.id, function (err, record) {
    console.log('validTicket:', err, record.id);

  });

  // check in
  ticketAPI.checkIn(salvedTicket.id, actorId function (err, record) {
    console.log('checkIn:', err, record.id);
  });

  // Set ticket status to used, all done (optional), 
  // use this action to close one ticket after user leaves the event if it cant returns
  ticketAPI.useTicket(salvedTicket.id, actorId,function (err, record) {
    console.log('useTicket:', err, record.id);
  });
});

```


## Links

> * We.js site: http://wejs.org

## NPM Info:

[![NPM](https://nodei.co/npm/we-plugin-ticket.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/we-plugin-ticket/)

## License

Under [the MIT license](https://github.com/wejs/we/blob/master/LICENSE.md)