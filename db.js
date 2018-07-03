'use strict';

require('dotenv').config();

let mongoose = require('mongoose');
mongoose.Promise = global.Promise

let UpidoModel = require('./models/Upido')

const options = {
    //useMongoClient: true,
    autoIndex: false, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    user: process.env.MONGO_DB_USER,
    pass: process.env.MONGO_DB_PASS
  };

mongoose.connect(process.env.MONGO_DB_URI, options);
//.then(()   => { console.log('Connected to MongoDB using '+process.env.MONGO_DB_URI+'! 😃🔥'); })
//.catch(err => { console.error('Failed to connect to MongoDB using '+process.env.MONGO_DB_URI+'! 😕💥 '); });

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => { console.log('Mongoose default connection open to ' + process.env.MONGO_DB_URI); }); 
// If the connection throws an error
mongoose.connection.on('error', (err) => { console.error('Mongoose default connection error: ' + err); }); 
// When the connection is disconnected
mongoose.connection.on('disconnected', () => { console.log('Mongoose default connection disconnected'); });
  
// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
    mongoose.connection.close(() => { 
        console.log('Mongoose default connection disconnected through app termination'); 
        process.exit(0); 
    }); 
}); 

var exports = module.exports = {
    findAllTrackingNr : function findAllTrackingNr(
        callback = docs => { console.log(JSON.stringify( { docs } )); } 
	) {
        UpidoModel.findAllTrackingNr()
            .then(docs => { callback(docs); })
            .catch(err => { console.error(err); });
    },
    findByTrackingNr : function findByTrackingNr(
        trackingNr,
        callback = docs => { console.log(JSON.stringify( { docs } )); }
	) {
        UpidoModel.findByTrackingNr(trackingNr)
            .then(docs => { callback(docs); })
            .catch(err => { console.error(err); });
	},
    findByTrackingNrArray : function findByTrackingNrArray(
        trackingNrArray,
        callback = docs => { console.log(JSON.stringify( { docs } )); }
	) {
        UpidoModel.findByTrackingNrArray(trackingNrArray)
            .then(docs => { callback(docs); })
            .catch(err => { console.error(err); });
	}
};

function test() {
    exports.findAllTrackingNr(nrs => { 
        console.log(nrs.length); 
        exports.findByTrackingNrArray(nrs, docs => {
            console.log(docs.length); 
            docs.map(d =>
                exports.findByTrackingNr(
                    d.tracking_nr, 
                    docs => docs.map(d => console.log(d.tracking_nr))
                )
            );
        });
    });
}

//test();
    

