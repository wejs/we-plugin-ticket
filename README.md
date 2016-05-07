# we-plugin-ticket

Plugin to add all process related to generate and valid event tickets


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

## License

Under [the MIT license](https://github.com/wejs/we/blob/master/LICENSE.md)