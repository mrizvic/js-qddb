# QDDB - quick and dirty database

I needed simple and RESTful key/value storage so I ended up writing this.
Each stored key has a property of created, modified and accessed timestamp in ISO 8601 format.

SIGUSR2 signal handler is written to produce some statistics on console.info()


## Usage:

Run with nodejs
```
$ nodejs qddb.js
[2015-06-30 15:04:32.561] [LOG] PID: 5034
[2015-06-30 15:04:32.567] [LOG] Application name: qddb.js
[2015-06-30 15:04:32.787] [LOG] Listening at http://127.0.0.1:8002
[2015-06-30 15:04:35.886] [LOG] { key: 'key1', value: 'value1' }
[2015-06-30 15:04:35.888] [LOG] doesnt exist, creating new object, key=key1
[2015-06-30 15:04:35.903] [LOG] { key: 'key2', value: '2' }
[2015-06-30 15:04:35.904] [LOG] doesnt exist, creating new object, key=key2
[2015-06-30 15:04:35.912] [LOG] { key: '3', value: '3' }
[2015-06-30 15:04:35.912] [LOG] doesnt exist, creating new object, key=3
[2015-06-30 15:04:35.919] [LOG] { key: 'temperature', value: '23.45' }
[2015-06-30 15:04:35.919] [LOG] doesnt exist, creating new object, key=temperature
[2015-06-30 15:04:35.926] [LOG] { key: 'humidity', value: '56.78' }
[2015-06-30 15:04:35.926] [LOG] doesnt exist, creating new object, key=humidity
```

interrupt with CTRL+C
```
^C[2015-06-30 15:47:58.136] [LOG] We-should-cleanup signal catched.. shutting down
[2015-06-30 15:47:58.136] [LOG] closing application socket
[2015-06-30 15:47:58.136] [INFO] API requests: 6
[2015-06-30 15:47:58.137] [INFO] GET requests: 0
[2015-06-30 15:47:58.137] [INFO] PUT/POST requests: 5
[2015-06-30 15:47:58.138] [INFO] DELETE requests: 0
[2015-06-30 15:47:58.138] [INFO] objects in memory: 5
[2015-06-30 15:47:58.139] [INFO] objects memory usage: 458
[2015-06-30 15:47:58.139] [LOG] process ends here
```


## Storing and retrieving variables

Store value1 under key1
```
curl http://127.0.0.1:8002/key1/value1 -XPUT
curl http://127.0.0.1:8002/key1/value1 -XPOST
```

Retrieve value of key1. Output is JSON formatted (see examples below).
```
curl http://127.0.0.1:8002/key1
```

Delete key1
```
curl http://127.0.0.1:8002/key1 -XDELETE
```

Dump all keys with their attributes:
```
curl http://127.0.0.1:8002/cmd/list
```

Store many variables under key2 and make key2 FIFO buffered with limit of 20 elements
```
for value in $(seq 11 55); do
	curl -XPOST http://127.0.0.1:8002/key2/$value/20
done
```

Now retrieve last stored variable:
```
curl http://127.0.0.1/key2
```
or retrieve last 5 stored variables
```
curl http://127.0.0.1/key2/5
```
each stored variable has timestamp attribute of when the variable was stored. By specifying from (e.g. 1461405500) and to (e.g. 1461405620) epoch time one can retrieve variables stored at specific time:
```
curl http://127.0.0.1/key2/1461405500/1461405620
```


## In practice:

```

server$ env | grep PS1
PS1=\[\e[1;33m\]\w\n\[\e[1;32m\]\h\[\e[m\]$
~

server$ curl http://127.0.0.1:8002/key1/value1 -XPUT
OK~
server$ curl http://127.0.0.1:8002/key1/value1 -XPOST
OK~
server$ curl http://127.0.0.1:8002/key1
{"key":"key1","value":"value1"}~
server$ curl -s http://127.0.0.1:8002/cmd/list | jq .
[
  {
    "accessed": "2015-06-30T12:44:29.169Z",
    "created": "2015-06-30T12:44:29.169Z",
    "modified": "2015-06-30T12:44:31.809Z",
    "value": "value1",
    "key": "key1"
  }
]
~
server$ curl http://127.0.0.1:8002/key1 -XDELETE
OK~
server$ curl http://127.0.0.1:8002/cmd/list
[]~
server$ curl http://127.0.0.1:8002/key1
{"error":"undefined"}~
```

Always stay up to date with your Raspberry PI CPU temperature (and make sure you check out the widget software below)
```
pi@raspberrypi ~ $ curl http://127.0.0.1:8002/RPI2-CPUTEMP/$(vcgencmd measure_temp | cut -d '=' -f2 | cut -d "'" -f1) -XPUT
OKpi@raspberrypi ~ $
```

Now we fill key2 with FIFO buffered 8 elements:

```
$ for value in $(seq 11 22); do curl -XPOST http://127.0.0.1:8002/key2/$value/8 ; sleep 1 ; done                                                                                                              [3/13]
OKOKOKOKOKOKOKOKOKOKOKOK$
$ curl -s http://127.0.0.1:8002/key2 | jq .
{
  "key": "key2",
  "first_timestamp": "2016-04-23T10:16:04.228Z",
  "last_timestamp": "2016-04-23T10:16:29.498Z",
  "first_value": "15",
  "last_value": "22",
  "value": "22",
  "created": "2016-04-23T10:08:06.404Z",
  "modified": "2016-04-23T10:16:29.498Z",
  "total_values": 8
}
```

Retrieve all elements:
```
$ curl -s http://127.0.0.1:8002/key2/0 | jq .
{
  "key": "key2",
  "values": [
    [
      "2016-04-23T10:16:04.228Z",
      "15"
    ],
    [
      "2016-04-23T10:16:07.836Z",
      "16"
    ],
    [
      "2016-04-23T10:16:11.447Z",
      "17"
    ],
    [
      "2016-04-23T10:16:15.056Z",
      "18"
    ],
    [
      "2016-04-23T10:16:18.666Z",
      "19"
    ],
    [
      "2016-04-23T10:16:22.278Z",
      "20"
    ],
    [
      "2016-04-23T10:16:25.887Z",
      "21"
    ],
    [
      "2016-04-23T10:16:29.498Z",
      "22"
    ]
  ],
  "accessed": "2016-04-23T10:17:07.696Z",
  "created": "2016-04-23T10:08:06.404Z",
  "modified": "2016-04-23T10:16:29.498Z"
}
```

Retrieve last 3 stored elements:
```
$ curl -s http://127.0.0.1:8002/key2/3 | jq .
{
  "key": "key2",
  "values": [
    [
      "2016-04-23T10:16:22.278Z",
      "20"
    ],
    [
      "2016-04-23T10:16:25.887Z",
      "21"
    ],
    [
      "2016-04-23T10:16:29.498Z",
      "22"
    ]
  ],
  "accessed": "2016-04-23T10:17:32.558Z",
  "created": "2016-04-23T10:08:06.404Z",
  "modified": "2016-04-23T10:16:29.498Z"
}
```

Retrieve elements stored between 1461406570 and 1461406580:
```
$ curl -s http://127.0.0.1:8002/key2/1461406570/1461406580 | jq .
{
  "key": "key2",
  "values": [
    [
      "2016-04-23T10:16:11.447Z",
      "17"
    ],
    [
      "2016-04-23T10:16:15.056Z",
      "18"
    ],
    [
      "2016-04-23T10:16:18.666Z",
      "19"
    ]
  ],
  "accessed": "2016-04-23T10:23:06.698Z",
  "created": "2016-04-23T10:08:06.404Z",
  "modified": "2016-04-23T10:16:29.498Z"
}
```

## Android Universal Widget

### Note: Android Universal Widget is not supported in current version. Please find [historic version here](https://github.com/mrizvic/js-qddb/tree/43563bc96a4de36f69b1706202e7ca97895ee9c6) if you want widget support.

In order to display key/values on your favourite android gadget you can install [Universal Widget](https://play.google.com/store/apps/details?id=uk.cdev.universalwidget.v1) and use following URL to catch your stored values.

```
$ curl http://127.0.0.1:8002/cmd/uw | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   267  100   267    0     0  39218      0 --:--:-- --:--:-- --:--:-- 44500
{
  "data": [
    {
      "value": "3",
      "name": "3"
    },
    {
      "value": "value1",
      "name": "key1"
    },
    {
      "value": "2",
      "name": "key2"
    },
    {
      "value": "23.45",
      "name": "temperature"
    },
    {
      "value": "56.78",
      "name": "humidity"
    }
  ],
  "date": "Tue Jun 30 2015 15:08:34 GMT+0200 (CEST)",
  "type": "list",
  "title": "my internet of things"
}
```


Result is shown below

![QDDB.js and Univeral Widget in action](https://raw.githubusercontent.com/mrizvic/js-qddb/master/universalwidget.png)

![QDDB.js and Univeral Widget in action](https://raw.githubusercontent.com/mrizvic/js-qddb/master/universalwidget2.png)


