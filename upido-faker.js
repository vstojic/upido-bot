'use strict';

const faker		= require('faker');
//const util 		= require('util');
const moment	= require('moment');

const MIN_SHOPPERS              = 10,		MAX_SHOPPERS              = 100,
	  MIN_ITEMS                 = 10,		MAX_ITEMS                 = 20,
	  MIN_RECENT_DAYS           = 7,		MAX_RECENT_DAYS           = 28,
	  MIN_STATUS_CHECK_INTERVAL = 10000,	MAX_STATUS_CHECK_INTERVAL = 30000; 
	  
const SHIPPING_COMPANY = [	'United Parcel Service, Inc.','DHL Express','FedEx Corporation',
							'United States Postal Service','Schenker AG','TNT N.V.',
							'YRC Worldwide','Parcelforce Worldwide','Royal Mail','Japan Post Service' ];

function start(	pingHandler, checkoutHandler, items, minRecentDays, maxRecentDays, statusCheckInterval) {

	console.log(JSON.stringify( { start : { 
		items : items, 
		minRecentDays : minRecentDays, 
		maxRecentDays : maxRecentDays, 
		statusCheckInterval : statusCheckInterval } } ));

	let fakeShopper = new exports.FakeShopper();
	let orderSet = new Set();
	for (let i = 0 ; i < items; i++) {
		orderSet.add(new exports.FakeOrder(fakeShopper, 
			faker.random.number( { min : minRecentDays, max : maxRecentDays } ), 
			statusCheckInterval)
		);
	}

	let orders = [...orderSet];
	let i = 0; 
	let intervalId = setInterval(() => { 
			pingHandler(orders[i++]);
			if (i == items) { clearInterval(intervalId); checkoutHandler(fakeShopper); }
		}, statusCheckInterval
	);

	return new exports.FakeJob(intervalId, statusCheckInterval, orders);
}

var exports = module.exports = {
	FakeShopper : function FakeShopper() { //ctor
		//faker.seed(faker.random.number());
		return JSON.parse(faker.fake(
			'{ 	"id"				: "' + faker.random.uuid() + '", \
				"name"				: "{{name.findName}}", \
				"avatar"			: "{{image.avatar}}", \
				"image"				: "{{image.people(100,100)}}", \
				"streetAddress"		: "{{address.streetAddress}}", \
				"city"				: "{{address.city}}", \
				"zipCode"			: "{{address.zipCode}}", \
				"country"			: "{{address.country}}", \
				"countryCode"		: "{{address.countryCode}}", \
				"state" 			: "{{address.state}}", \
				"latitude" 			: "{{address.latitude}}", \
				"longitude" 		: "{{address.longitude}}" }'
			));
	},
	FakeOrder : function FakeOrder(shopper, recentDays, statusCheckInterval) { //ctor
		//faker.seed(faker.random.number());
		this.id						= faker.random.uuid();
		var recent					= faker.date.recent(recentDays);
		this.date					= recent.toISOString();
		this.duration				= Math.floor(moment.duration(moment().diff(moment(recent))).asDays());
		this.shopper			    = shopper;
		this.product   				= faker.commerce.productName();
		this.price   				= faker.commerce.price();
		this.retailer   			= faker.company.companyName();
		this.statusCheckInterval	= statusCheckInterval;
		//this.shippingCompany		= null;
		//if (faker.random.arrayElement([ true, true, false ])) { 
			this.shippingCompany	= faker.random.objectElement(SHIPPING_COMPANY);
		//} 
	},
	FakeJob : function FakeJob(intervalId, statusCheckInterval, orders) { //ctor
		this.id						= faker.random.uuid();
		this.intervalId				= intervalId;
		this.statusCheckInterval	= statusCheckInterval;
		this.orders					= orders;
	},
	startRandomStatusUpdates : function startRandomStatusUpdates(
			pingHandler 	= (fakeOrder) 	=> { console.log('Ping sent: ' 				+ JSON.stringify( { FakeOrder : fakeOrder } )); }, 
			checkoutHandler = (fakeShopper) => { console.log('Shopper checked out: ' 	+ JSON.stringify( { FakeShopper : fakeShopper } )); }, 
			minShoppers             = MIN_SHOPPERS,              maxShoppers             = MAX_SHOPPERS, 
			minItems                = MIN_ITEMS,                 maxItems                = MAX_ITEMS,
			minRecentDays           = MIN_RECENT_DAYS,           maxRecentDays           = MAX_RECENT_DAYS,
			minStatusCheckInterval  = MIN_STATUS_CHECK_INTERVAL, maxStatusCheckInterval  = MAX_STATUS_CHECK_INTERVAL) {	

		console.log(JSON.stringify( 
			{ startRandomStatusUpdates : { 
				minShoppers : minShoppers, maxShoppers : maxShoppers, 
				minItems : minItems, maxItems : maxItems, 
				minRecentDays : minRecentDays, maxRecentDays : maxRecentDays, 
				minStatusCheckInterval : minStatusCheckInterval, maxStatusCheckInterval : maxStatusCheckInterval } } ));

		faker.seed(faker.random.number());
		let intervalIds = new Set();
		for (let i = 0; i < faker.random.number( { min : minShoppers, max : maxShoppers } ); i++) {
			intervalIds.add(start(pingHandler, checkoutHandler,
				faker.random.number( { min : minItems, max : maxItems } ), 
				minRecentDays, maxRecentDays, 
				faker.random.number( { min : minStatusCheckInterval, max : maxStatusCheckInterval } )));
		}
		
		return [...intervalIds];
	},
	markdownSummary : function markdownSummary(fakeJobArray) {
		return '*' + fakeJobArray.length + '* shopper(s) having total *' +  
			fakeJobArray.map(fakeJob => fakeJob.orders.length).reduce((a, b) => a + b, 0) + '* order(s) ' + 
			'and average activity every *' + 
			(fakeJobArray.map(fakeJob => fakeJob.statusCheckInterval).reduce((a, b) => a + b, 0) / 
			fakeJobArray.map(fakeJob => fakeJob.orders.length).reduce((a, b) => a + b, 0)) + '* ms';
	},
	clear : function clear (fakeJob, checkoutHandler = (fakeShopper) => { console.log('Job cleared for: ' + JSON.stringify( { FakeShopper : fakeShopper } )); } ) {
		clearInterval(fakeJob.intervalId); checkoutHandler(fakeJob.orders[0].shopper);
	},
	clearAll : function clearAll (fakeJobArray, checkoutHandler = (fakeShopper) => { console.log('Job cleared for: ' + JSON.stringify( { FakeShopper : fakeShopper } )); } ) {
		fakeJobArray.map(fakeJob => exports.clear(fakeJob, checkoutHandler(fakeJob.orders[0].shopper)) );
		while (fakeJobArray.length) { fakeJobArray.pop(); }
		// alternatively: 
		fakeJobArray.splice(0, fakeJobArray.length);
	}
};

//exports.startRandomStatusUpdates(); //.map(fakeJob => console.log(fakeJob.intervalId));
//exports.clearAll(exports.startRandomStatusUpdates());
/*
exports.startRandomStatusUpdates((obj) => {}, (fakeShopper) => {
	//console.log(encodeURIComponent(JSON.stringify( { FakeOrder : obj } )));
	console.log(JSON.stringify( { FakeShopper : fakeShopper } ));
});
*/