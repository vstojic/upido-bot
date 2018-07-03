'use strict';

let mongoose = require('mongoose');
mongoose.Promise = global.Promise

let Schema = mongoose.Schema;

// create a schema
let upidoSchema = new Schema({
  tracking_nr: String,
  ordering_dtp: Date,
  country_of_orig_dtp: Date,
  country_of_dest_dtp: Date,
  local_po_dtp: Date,
  final_real_dt: Date
});

upidoSchema.statics.findAll = function() {
  return new Promise((resolve, reject) => {
    this.find((err, docs) => {
      if(err) {
        console.error(err);
        return reject(err);
      };
      resolve(docs);
    });
  });
};

upidoSchema.statics.findAllTrackingNr = function() {
  return new Promise((resolve, reject) => {
    this.distinct('tracking_nr', (err, docs) => {
      if(err) {
        console.error(err);
        return reject(err);
      };
      resolve(docs);
    });
  });
};

upidoSchema.statics.findByTrackingNr = function(trackingNr) {
  return new Promise((resolve, reject) => {
    this.find({ tracking_nr: trackingNr }, (err, docs) => {
      if(err) {
        console.error(err);
        return reject(err);
      };
      resolve(docs);
    });
  });
};

upidoSchema.statics.findByTrackingNrArray = function(trackingNrArray) {
  return new Promise((resolve, reject) => {
    this.find({ tracking_nr: { $in : trackingNrArray } }, (err, docs) => {
      if(err) {
        console.error(err);
        return reject(err);
      };
      resolve(docs);
    });
  });
};

// the schema is useless until we need create a model using it
let UpidoModel = mongoose.model('Upido', upidoSchema, 'upido-collection');

// ... and make it available
module.exports = UpidoModel;
