'use strict';

require('dotenv').config(); // load .env into process.env

const os = require('os'); // os.EOL

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const moment	= require('moment');
//const url = require('url');
//const querystring = require('querystring');

const axios = require('./axios');
const faker = require('./upido-faker');
const db    = require('./db');

const PORT            = process.env.PORT || 8080;
const UPIDO_BOT_TOKEN = process.env.UPIDO_BOT_TOKEN;
const UPIDO_BOT_URL   = process.env.UPIDO_BOT_URL;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded
//app.use('/static', express.static('static')); // to serve static files

function sendHelpMessage (req, res, chat_id) {
  axios.sendMarkdownMessage(req, res, chat_id,
    '*Dear Upidoer, welcome to the world of Upido!*' + os.EOL + os.EOL + 
    'For delivery time predictions, please post an image with some tracking numbers. Also, feel free to try out the following valid commands:' + os.EOL + os.EOL + 
    '`/<tracking-number>` - to get delivery time estimation for parcel having the supplied <tracking-number>;' + os.EOL +
    '`/run [<JSON>]     ` - to start (or /run) a new simulation process (optionally parametrized using given JSON);' + os.EOL +
    '`/status           ` - to get a /status of the currently running simulation;' + os.EOL +
    '`/kill             ` - to terminate (or /kill) the currently running simulation;' + os.EOL +
    '`/help             ` - to display this (/help) message.'
  );
}

var fakeJobArray = null;
moment.locale('de-ch');

//This is the route the API will call
app.post('/webhook', function(req, res) {

  const {message} = req.body;

  if (message && message.document || message && message.photo) {
    
    axios.parseImage(req, (words, err) => { 
      db.findByTrackingNrArray(words, docs => {
        axios.postMarkdownMessage(message.chat.id,
          '*Many thanks for posting this image.* ' + 
          'Total *' + words.length + '* word(s) have been parsed from it. ' + 
          'However, only *' + docs.length + '* word(s) appear to be valid tracking numbers at the moment: ' + os.EOL + os.EOL + 
          docs.map(d => '/' + d.tracking_nr).join(os.EOL) + os.EOL + os.EOL +
          'For each valid tracking number, a delivery time prediction is pending. Please, remain patient and feel free to post further images.'
        ).then(response => {
          docs.map(d => axios.postMarkdownMessage(message.chat.id,
                '*Delivery time prediction for tracking number:* /' + d.tracking_nr + os.EOL + os.EOL +
                '`When ordering                             `  *' + moment(d.ordering_dtp).format('LLLL')        + '*' + os.EOL +
                '`Before leaving the country of origin      `  *' + moment(d.country_of_orig_dtp).format('LLLL') + '*' + os.EOL +
                '`After reaching the country of destination `  *' + moment(d.country_of_dest_dtp).format('LLLL') + '*' + os.EOL +
                '`After reaching the final local post office`  *' + moment(d.local_po_dtp).format('LLLL')        + '*' + os.EOL +
                '`Final real delivery time                  `  *' + moment(d.final_real_dt).format('LLLL')       + '*' + os.EOL + os.EOL
          ));
          res.end('ok');
        }).catch(err => { res.end('ERROR: ' + err); });
      });
    });
    return res.end();
  }
  
  if (!message || (message.text.toLowerCase().indexOf('/')       < 0 
               &&  message.text.toLowerCase().indexOf('/start')  < 0 
               &&  message.text.toLowerCase().indexOf('/run')    < 0 
               &&  message.text.toLowerCase().indexOf('/status') < 0
               &&  message.text.toLowerCase().indexOf('/kill')   < 0
               &&  message.text.toLowerCase().indexOf('/help')   < 0)) {
    // In case a message is not present... do nothing and return an empty response
    console.log('Unknown command: ' + message.text);
    axios.sendMarkdownMessage(req, res, message.chat.id,
      'Unknown command: `' + message.text + '`.' + os.EOL
    );
    sendHelpMessage(req, res, message.chat.id);
    return res.end();
  }

  const msgSplit = message.text.replace(/ +(?= )/g,'').split(' ');
  const cmd = msgSplit[0].toLowerCase().substring(1);

  if (cmd == 'kill') {
    if (fakeJobArray && fakeJobArray.length) {
      let summary = faker.markdownSummary(fakeJobArray);
      faker.clearAll(fakeJobArray);
      axios.sendMarkdownMessage(req, res, message.chat.id,
        'Unconditionally stopping the Upido shopper community simulation started with following parameters:' + os.EOL + os.EOL +
        summary);
    } else {
      axios.sendMarkdownMessage(req, res, message.chat.id,
        'No currently running Upido shopper community simulation(s).');
    }
    return res.end();
  }

  if (cmd == 'status') {
    if (fakeJobArray && fakeJobArray.length) {
      let summary = faker.markdownSummary(fakeJobArray);
      axios.sendMarkdownMessage(req, res, message.chat.id,
        'Currently running is the Upido shopper community simulation started with following parameters:' + os.EOL + os.EOL +
        summary);
    } else {
      axios.sendMarkdownMessage(req, res, message.chat.id,
        'No currently running Upido shopper community simulation(s).');
    }
    return res.end();
  }

  if (cmd == 'start' || cmd == 'help') {
    sendHelpMessage(req, res, message.chat.id);
    return res.end();
  }

  // If no valid command is supplied, then it is assumed to be a tracking number
  if (msgSplit[0].startsWith('/')) {
    db.findByTrackingNr(msgSplit[0].substring(1), docs => { 
        docs.map(d => axios.sendMarkdownMessage(
          req, res, message.chat.id,
          '*Thanks. You have just supplied an existing tracking number:* /' + d.tracking_nr + 
          '. And here is the delivery time prediction for it:' +  os.EOL + os.EOL +
          '`When ordering                             `  *' + moment(d.ordering_dtp).format('LLLL')        + '*' + os.EOL +
          '`Before leaving the country of origin      `  *' + moment(d.country_of_orig_dtp).format('LLLL') + '*' + os.EOL +
          '`After reaching the country of destination `  *' + moment(d.country_of_dest_dtp).format('LLLL') + '*' + os.EOL +
          '`After reaching the final local post office`  *' + moment(d.local_po_dtp).format('LLLL')        + '*' + os.EOL +
          '`Final real delivery time                  `  *' + moment(d.final_real_dt).format('LLLL')       + '*' + os.EOL + os.EOL
        ));
      }
    );
    return res.end();
  }
  
  var paramObj = new Object();
  if (msgSplit.length > 1) { try { paramObj = JSON.parse(msgSplit[1]); } catch (e) { } }
  paramObj = JSON.parse(
    '{ "minShoppers" : ' + ((typeof paramObj.minShoppers !== 'undefined') ? parseInt(paramObj.minShoppers) : 10) + 
    ', "maxShoppers" : ' + ((typeof paramObj.maxShoppers !== 'undefined') ? parseInt(paramObj.maxShoppers) : 20) + 
    ', "minItems" : ' + ((typeof paramObj.minItems !== 'undefined') ? parseInt(paramObj.minItems) : 10) + 
    ', "maxItems" : ' + ((typeof paramObj.maxItems !== 'undefined') ? parseInt(paramObj.maxItems) : 20) + 
    ', "minRecentDays" : ' + ((typeof paramObj.minRecentDays !== 'undefined') ? parseInt(paramObj.minRecentDays) : 10) + 
    ', "maxRecentDays" : ' + ((typeof paramObj.maxRecentDays !== 'undefined') ? parseInt(paramObj.maxRecentDays) : 20) + 
    ', "minStatusCheckInterval" : ' + ((typeof paramObj.minStatusCheckInterval !== 'undefined') ? parseInt(paramObj.minStatusCheckInterval) : 1000) + 
    ', "maxStatusCheckInterval" : ' + ((typeof paramObj.maxStatusCheckInterval !== 'undefined') ? parseInt(paramObj.maxStatusCheckInterval) : 10000) +
    ' }'
  );

  //var chatId = message.chat.id;

  fakeJobArray = faker.startRandomStatusUpdates((obj) => {
    axios.sendMarkdownMessage(req, res, message.chat.id,
      'STATUS UPDATE for order *' + obj.id + '*' + os.EOL + os.EOL +
      '`        From:` [' + obj.shopper.name + '](' + obj.shopper.avatar + ') (active every ' + obj.statusCheckInterval + ' ms) ' + os.EOL + 
      '`     Address:` *' + obj.shopper.streetAddress + '* ' + //os.EOL + 
      '`        City:` *' + obj.shopper.city + '* ' + //os.EOL + 
      '`     ZipCode:` *' + obj.shopper.zipCode + '* ' + //os.EOL + 
      '`     Country:` *' + obj.shopper.country + ' (' + obj.shopper.countryCode + ')* ' + os.EOL + 
      '`    Latitude:` *' + obj.shopper.latitude + '* ' + os.EOL + 
      '`   Longitude:` *' + obj.shopper.longitude + '* ' + os.EOL + os.EOL + 
      '`     Product:` *' + obj.product + '* ' + os.EOL + 
      '`       Price:` *' + obj.price + '* ' + os.EOL + 
      '`    Retailer:` *' + obj.retailer + '* ' + os.EOL + 
      '`        Date:` *' + obj.date + '* (`' + obj.duration+ ' day(s)` ago)' + os.EOL + os.EOL +
      ((obj.shippingCompany != null) ? 
      '`  Shipped By:` *' + obj.shippingCompany + '* (after `' + obj.duration+ ' day(s)`)' + os.EOL : '')
    );

  }, (shopper) => {

    // Still, there is some ping(s) pending
    fakeJobArray = fakeJobArray.filter(fakeJob => fakeJob.orders[0].shopper !== shopper);

    axios.sendMarkdownMessage(req, res, message.chat.id,
      'Shopper *checked out*: [' + shopper.name + '](' + shopper.avatar + ') ' + os.EOL + os.EOL +
      '`     Address:` *' + shopper.streetAddress + '* ' + //os.EOL + 
      '`        City:` *' + shopper.city + '* ' + //os.EOL + 
      '`     ZipCode:` *' + shopper.zipCode + '* ' + //os.EOL + 
      '`     Country:` *' + shopper.country + ' (' + shopper.countryCode + ')* ' + os.EOL + 
      '`    Latitude:` *' + shopper.latitude + '* ' + os.EOL + 
      '`   Longitude:` *' + shopper.longitude + '* ' + os.EOL + os.EOL +
      ((fakeJobArray.length > 0) ? 
      'Still currently active are ' + faker.markdownSummary(fakeJobArray) : 
      '*No active shoppers.* Please, run another simulation: `run [<JSON>]`') + os.EOL
    );

  },paramObj.minShoppers,
    paramObj.maxShoppers,
    paramObj.minItems,
    paramObj.maxItems,
    paramObj.minRecentDays,
    paramObj.maxRecentDays,
    paramObj.minStatusCheckInterval,
    paramObj.maxStatusCheckInterval);

  axios.sendMarkdownMessage(req, res, message.chat.id,
    'Starting another Upido shopper community simulation with the following parameters:' + os.EOL + os.EOL +
    '`' + JSON.stringify(paramObj) + '`' + os.EOL + os.EOL +
    'Use exactly this JSON schema when supplying input for the _run_ command: `run [<JSON>]`' + os.EOL + os.EOL +
    'Final (random) simulation parameters: ' + faker.markdownSummary(fakeJobArray) + os.EOL);

});

// Finally, start our server
app.listen(PORT, function() {
  console.log(`Upido Bot webhook listening on port ${PORT}`);
});

