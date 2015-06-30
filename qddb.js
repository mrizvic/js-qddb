// TODO (always) write more error handling stuff
var host = '127.0.0.1';
var port = 8002;
var myAppName="qddb.js";	//quick and dirty database

require("console-stamp")(console, "yyyy-mm-dd HH:MM:ss.l");
require('querystring').unescape;

console.log('PID: ' + process.pid)
console.log('Application name: ' + myAppName)

var sizeof = require('object-sizeof');
var express = require('express');
var app = express();

// counters
var apiRequests=0;
var counterGet=0;
var counterPut=0;
var counterPost=0;
var counterDelete=0;


// objects
var KVObject = function(key, value) {
	this.key = key
	this.value = value
	this.modified = new Date()
	this.created = new Date()
	this.accessed = new Date()
}


// object storage
var arrayKVObjects = [];

// store object procedure
storeKeyValue = function(req,res) {
	apiRequests++;
	counterPut++;
	console.log(req.params);
	var key = req.params.key;
	var value = req.params.value;

	exists = typeof(arrayKVObjects[key]);

	if (exists == 'undefined') {
		console.log('doesnt exist, creating new object, key='+key)
		arrayKVObjects[key] = new KVObject(key, value);
	} else {
		arrayKVObjects[key].value = value;
		arrayKVObjects[key].modified = new Date();
	}

	res.send('OK');
};


// get all objects
app.get('/cmd/list', function(req, res) {
	var keys = [];
	for (var key in arrayKVObjects) {
		keys.push(arrayKVObjects[key]);
	}
	res.send(keys);
});

// get value for specific key
app.get('/:key', function(req,res) {
	apiRequests++;
	counterGet++;
	console.log(req.params);
	var key = req.params.key;
	exists = typeof(arrayKVObjects[key]);

	if (exists == 'undefined') {
		var resp = {};
		resp['error'] = 'undefined';
		console.log(JSON.stringify(resp));
		res.send(resp);
	} else {
		arrayKVObjects[key].accessed = new Date();
		res.send(arrayKVObjects[key].value);
	}
});

// delete specific key
app.delete('/:key', function(req,res) {
	apiRequests++;
	counterDelete++;
	console.log(req.params);
	var key = req.params.key;
	delete arrayKVObjects[key];
	res.send('OK');
});

// methods to store key/value object
app.put('/:key/:value', storeKeyValue);
app.post('/:key/:value', storeKeyValue);


// get some stats
var printStatistics = function() {
	console.info('API requests: ' + apiRequests);
	console.info('GET requests: ' + counterGet);
	console.info('PUT requests: ' + counterPut);
	console.info('POST requests: ' + counterPost);
	console.info('DELETE requests: ' + counterDelete);
	console.info('objects in memory: ' + Object.keys(arrayKVObjects).length);
	console.info('objects memory usage: ' + sizeof(arrayKVObjects));
};

var signalHandler = function() {
	console.log('We-should-cleanup signal catched.. shutting down');

	console.log('closing application socket');
	try {
		server.close();
	}
	catch(e) {
		console.error('server.close() error: ' + e);
	}
	
	printStatistics();

	console.log('process ends here');
	process.exit();
}

var server = app.listen(port, host, function() {
	console.log('Listening at http://%s:%s', host, port)
});

//catch some signals
//process.on('exit', signalHandler);
process.on('SIGINT', signalHandler);
process.on('SIGHUP', signalHandler);
process.on('SIGTERM', signalHandler);
//process.on('SIGUSR2', printStatistics);
process.on('SIGUSR2', signalHandler);
