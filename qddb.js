// IMPORTANT: run with nodejs --expose-gc to ensure memory optimisation

var host = '127.0.0.1';
var port = 8002;
var myAppName=__filename;
var myURL = 'http://' + host + ':' + port;

require("console-stamp")(console, "yyyy-mm-dd HH:MM:ss.l");
console.log('PID: ' + process.pid)
console.log('Application name: ' + myAppName)

if (global.gc) {
	console.log('global.gc() function enabled');
} else {
	console.log('global.gc() function disabled');
}

var sizeof = require('object-sizeof');
var express = require('express');
var app = express();

// Add headers
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});

// counters
var apiRequests=0;
var counterGet=0;
var counterPutPost=0;
var counterDelete=0;

var dynamicKeys=0;
var valueCounter=0;

// DYNAMIC OBJECTS START
// key/value objects
var KVObject_dynamic = function(key) {
    this.key = key;
	this.value = undefined;
    this.values = Array();
    this.created = new Date();
    this.accessed = undefined;
    this.modified = undefined;
};

// storage for key/value objects
var arrayKVObjects_dynamic = {};

// DYNAMIC OBJECTS STOP

// store object procedure
storeKV_dynamic = function(req,res) {
	apiRequests++;
	counterPutPost++;
	console.log('POST / ' + JSON.stringify(req.params));
	var key = req.params.key;
	var value = req.params.value;
	var limit = req.params.limit;

	raw_storeKV_dynamic(key, value, limit);

	res.send('OK');
};

// store object procedure for performance testing
raw_storeKV_dynamic = function(key, value, limit) {
    var exists = typeof(arrayKVObjects_dynamic[key]);

	// if key undefiend then create new entry
    if (exists == 'undefined') {
        console.log('dynamic object doesnt exist, creating new object, key='+key)
        arrayKVObjects_dynamic[key] = new KVObject_dynamic(key);
        dynamicKeys++;
    }

	var myDate = new Date();
	var tmp = [myDate, value]
	// if limit undefined store single value, else push [timestamp,value] to array
	if (typeof(limit) == 'undefined') {
		arrayKVObjects_dynamic[key].values=[tmp];
	} else {
    	arrayKVObjects_dynamic[key].values.push(tmp);
		var valueCount = arrayKVObjects_dynamic[key].values.length;
		// splice table if it exceeds limit
    	if (valueCount > limit) {
			howMany = valueCount - limit;
       	 	arrayKVObjects_dynamic[key].values.splice(0,howMany);
    	}
    }
	arrayKVObjects_dynamic[key].modified = myDate;
	valueCounter = arrayKVObjects_dynamic[key].values.length;
};

// get all dynamic objects
app.get('/cmd/list', function(req, res) {
	apiRequests++;
	counterGet++;
	var keys = [];
	for (var key in arrayKVObjects_dynamic) {
		keys.push(arrayKVObjects_dynamic[key]);
	}
	res.send(keys);
});


// get info and single value for specific dynamic object
app.get('/:key', function(req,res) {
	apiRequests++;
	counterGet++;
	console.log('GET / ' + JSON.stringify(req.params));
	var key = req.params.key;
	var myDate = new Date();
	var resp = {};
	exists = typeof(arrayKVObjects_dynamic[key]);

	// if key doesnt exist produce error message
	if (exists == 'undefined') {
		res.status(404).send('nonexistent object');
		return;
	} else {
		var myLength = arrayKVObjects_dynamic[key].values.length;
		resp['key']=key;
		// if more than one stored value
		if (myLength > 1) {
			resp['first_timestamp']=arrayKVObjects_dynamic[key].values.slice(0,1)[0][0];
			resp['last_timestamp']=arrayKVObjects_dynamic[key].values.slice(-1)[0][0];
			resp['first_value']=arrayKVObjects_dynamic[key].values.slice(0,1)[0][1];
			resp['last_value']=arrayKVObjects_dynamic[key].values.slice(-1)[0][1];
		}
		// return last value as 'value'
		resp['value']=arrayKVObjects_dynamic[key].values.slice(-1)[0][1];
		resp['accessed']=arrayKVObjects_dynamic[key].accessed;
		resp['created']=arrayKVObjects_dynamic[key].created;
		resp['modified']=arrayKVObjects_dynamic[key].modified;
		resp['total_values']=myLength;
		arrayKVObjects_dynamic[key].accessed = myDate;
	}
	res.send(resp);
});

// get last ':limit' values for specific dynamic object
app.get('/:key/:limit(\\d+)', function(req,res) {
	apiRequests++;
	counterGet++;
	console.log('GET / ' + JSON.stringify(req.params));
	var key = req.params.key;
	var limit = req.params.limit;
	var myDate = new Date();
	var resp = {};
	exists = typeof(arrayKVObjects_dynamic[key]);

	if (exists == 'undefined') {
		res.status(404).send('nonexistent object');
		return;
	} else if (limit > myLength) {
		var myLength = arrayKVObjects_dynamic[key].values.length;
		// produce warning and limit response to myLength
		resp['warning'] = 'limit exceeds number of stored elements: ' + myLength + '/' + limit;
		console.log(JSON.stringify(resp));
		limit = myLength;
		//res.send(resp);
	}
	resp['key']=key;
	resp['values']=arrayKVObjects_dynamic[key].values.slice(-limit);
	resp['accessed']=arrayKVObjects_dynamic[key].accessed;
	resp['created']=arrayKVObjects_dynamic[key].created;
	resp['modified']=arrayKVObjects_dynamic[key].modified;
	arrayKVObjects_dynamic[key].accessed = myDate;
	res.send(resp);
	
});

// get values for specific dynamic object stored between ':from' and ':to' timestamp
app.get('/:key/:from(\\d+)/:to(\\d+)', function(req,res) {
	apiRequests++;
	counterGet++;
	console.log('GET / ' + JSON.stringify(req.params));
	var key = req.params.key;
	var from = req.params.from;
	var to = req.params.to;
	var myDate = new Date();
	var resp = {};
	from = new Date(from*1000);
	to = new Date(to*1000);
	exists = typeof(arrayKVObjects_dynamic[key]);

	if (exists == 'undefined') {
		res.status(404).send('nonexistent object');
		return;
	} else {
		var myLength = arrayKVObjects_dynamic[key].values.length;
		resp['key']=key;
		resp['values'] = Array();
		// loop through all keys and match to >= keytimestamp >= from
		for (i=0; i<myLength; i++) {
			myTS = arrayKVObjects_dynamic[key].values[i][0];
			if ( (myTS >= from) && (myTS <= to) ) {
				myValue = arrayKVObjects_dynamic[key].values[i][1];
				resp['values'].push([myTS,myValue]);
			}
		}
		resp['accessed']=arrayKVObjects_dynamic[key].accessed;
		resp['created']=arrayKVObjects_dynamic[key].created;
		resp['modified']=arrayKVObjects_dynamic[key].modified;
		arrayKVObjects_dynamic[key].accessed = myDate;
	}
	res.send(resp);
});

// delete dynamic object
app.delete('/:key', function(req,res) {
	apiRequests++;
	counterDelete++;
	console.log('DELETE /' + JSON.stringify(req.params));
	var key = req.params.key;
	arrayKVObjects_dynamic[key] = null;
	delete arrayKVObjects_dynamic[key];
	if (global.gc) {
		global.gc();
	}
	res.send('OK');
});

// methods to store key/value object
app.put('/:key/:value', storeKV_dynamic);
app.post('/:key/:value', storeKV_dynamic);

app.put('/:key/:value/:limit', storeKV_dynamic);
app.post('/:key/:value/:limit', storeKV_dynamic);

// get some stats
var printStatistics = function() {
	console.info('API requests: ' + apiRequests);
	console.info('GET requests: ' + counterGet);
	console.info('PUT/POST requests: ' + counterPutPost);
	console.info('DELETE requests: ' + counterDelete);
	// console.info('static keys in memory: ' + Object.keys(arrayKVObjects).length);
	console.info('dynamic keys in memory: ' + dynamicKeys);
	console.info('dynamic values in memory: ' + valueCounter);
	// console.info('array memory usage: ' + (sizeof(arrayKVObjects) + sizeof(arrayKVObjects_dynamic)));
	console.info('array memory usage: ' + sizeof(arrayKVObjects_dynamic));
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



// catch some signals
//process.on('exit', signalHandler);
process.on('SIGINT', signalHandler);
process.on('SIGHUP', signalHandler);
process.on('SIGTERM', signalHandler);
process.on('SIGUSR2', printStatistics);
// uncomment this if you use nodemon
//process.on('SIGUSR2', signalHandler);

process.on('uncaughtException', function(err) {
	if (err.code == 'EADDRINUSE') {
		console.error('unable to listen on %s:%s , %s', host, port, err);
	} else {
		console.error(err);	
	}
});

// var stdin = process.openStdin();
// stdin.addListener('data', function(dataz) {
//         //console.log('echo back: ' + dataz);
//         if (dataz.toString().trim() == 'stats') {
//                 printStatistics();
//         }
// });

// uncomment this for performance and memory test
//var perftest=1;

if (typeof(perftest) != 'undefined') {
	console.log('raw_storeKV_dynamic start');
	// for (var i=10000000000; i<10000015000; i++) {
	for (var i=1; i<10; i++) {
		raw_storeKV_dynamic('key1',i,15000)
		// raw_storeKV_dynamic('nucukwudisjajEuphmov',i,15000)
		// raw_storeKV_dynamic('civCeneevyehalhuvtho',i,15000)
		// raw_storeKV_dynamic('Eshkyifyunbodganfech',i,15000)
		// raw_storeKV_dynamic('Moz5grumcaxHuiltugUd',i,15000)
		// raw_storeKV_dynamic('TePetbecsyecWefNiabu',i,15000)
		// raw_storeKV_dynamic('rackgenmenIjNuwobres',i,15000)
		// raw_storeKV_dynamic('egWerlOrOacVakCegJer',i,15000)
		// raw_storeKV_dynamic('DouqueOpOorUnlewkom3',i,15000)
		// raw_storeKV_dynamic('JeishOrodEfOomDetEnk',i,15000)
		// raw_storeKV_dynamic('caywyFlydLonocOlCerv',i,15000)
		// raw_storeKV_dynamic('VuswapNevUndoddIbceo',i,15000)
		// raw_storeKV_dynamic('RawbijoppAnPoucosheb',i,15000)
		// raw_storeKV_dynamic('yuspOdyivoughUtshEm5',i,15000)
		// raw_storeKV_dynamic('ivDaquochCidjaHeunri',i,15000)
		// raw_storeKV_dynamic('cricirbibyimtOdVilhi',i,15000)
		// raw_storeKV_dynamic('vikwesEpvabnawumtUji',i,15000)
		// raw_storeKV_dynamic('Did7ShraynajaldOpBia',i,15000)
		// raw_storeKV_dynamic('VuIjBeunLapcushDick6',i,15000)
		// raw_storeKV_dynamic('pocdueckDatyigBuvAsy',i,15000)
		// raw_storeKV_dynamic('LoysgapMyboytseehiJu',i,15000)
		// raw_storeKV_dynamic('nesOvruhakCyrenGherg',i,15000)
		// raw_storeKV_dynamic('CatOtnexCeth7FroazOg',i,15000)
		// raw_storeKV_dynamic('IlumibsUsackImIrdyom',i,15000)
		// raw_storeKV_dynamic('JeirulretbiafdinIdKo',i,15000)
		// raw_storeKV_dynamic('RilibrAccutEynAdpiep',i,15000)
		// raw_storeKV_dynamic('krosyetDynckyeshvoys',i,15000)
		// raw_storeKV_dynamic('MidhedUrpiSlaipeejDo',i,15000)
		// raw_storeKV_dynamic('geegoufavtiemuQuigci',i,15000)
		// raw_storeKV_dynamic('SanmymfehuIbcapdeika',i,15000)
		// raw_storeKV_dynamic('OyptoglaxEzHuridokcu',i,15000)
		// raw_storeKV_dynamic('wavUgvifolfEurfAtIby',i,15000)
		// raw_storeKV_dynamic('FaiTworyijPhicIdJesp',i,15000)
		// raw_storeKV_dynamic('GaitjottyesjoBloicyi',i,15000)
		// raw_storeKV_dynamic('4OvEwHivRewOmticmek0',i,15000)
		// raw_storeKV_dynamic('ocGarAtkeptacDeshbon',i,15000)
		// raw_storeKV_dynamic('guhywofMenshijvufMaw',i,15000)
		// raw_storeKV_dynamic('UpDeOkjikeemodyivDit',i,15000)
		// raw_storeKV_dynamic('swadwyfuenjofAfcyWed',i,15000)
		// raw_storeKV_dynamic('blyujShokumauHyojkuc',i,15000)
		// raw_storeKV_dynamic('yolHyanwesvemcigudKi',i,15000)
		// raw_storeKV_dynamic('CrigFesvadCawcicjuvu',i,15000)
		// raw_storeKV_dynamic('TidPefyabeepGogfigDa',i,15000)
		// raw_storeKV_dynamic('cheymWoshFeneavjumMa',i,15000)
		// raw_storeKV_dynamic('AydjipsejDisyucullud',i,15000)
		// raw_storeKV_dynamic('FliowItOldyeytijlerv',i,15000)
		// raw_storeKV_dynamic('isvizeashuchotisBov2',i,15000)
		// raw_storeKV_dynamic('DyriwejpiriOntipWeal',i,15000)
		// raw_storeKV_dynamic('niWyickedJiognobKogs',i,15000)
		// raw_storeKV_dynamic('codBushkiccypNafcyni',i,15000)
		// raw_storeKV_dynamic('Adrynhefefvostidadtu',i,15000)
	}
	console.log('raw_storeKV_dynamic stop');
}
