# QDDB - quick and dirty database

I needed simple and RESTful key/value so I ended up writing this.
Each stored key has a property of created, modified and accessed timestamp in ISO 8601 format.

SIGUSR2 signal handler is written to produce some statistics on console.log()


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

Store value1 under key1
```
curl -L http://127.0.0.1:8002/key1/value1 -XPUT
curl -L http://127.0.0.1:8002/key1/value1 -XPOST
```

Retrieve value of key1
```
curl -L http://127.0.0.1:8002/key1
```

Delete key1
```
curl -L http://127.0.0.1:8002/key1 -XDELETE
```

Dump all keys with their attributes:
```
curl -L http://127.0.0.1:8002/cmd/list
```

## In practice:

```
server$ env | grep PS1
PS1=\[\e[1;33m\]\w\n\[\e[1;32m\]\h\[\e[m\]$
~

server$ curl -L http://127.0.0.1:8002/key1/value1 -XPUT
OK~
server$ curl -L http://127.0.0.1:8002/key1/value1 -XPOST
OK~
server$ curl -L http://127.0.0.1:8002/key1
value1~
server$ curl -L http://127.0.0.1:8002/cmd/list | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   146  100   146    0     0  16833      0 --:--:-- --:--:-- --:--:-- 18250
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
server$ curl -L http://127.0.0.1:8002/key1 -XDELETE
OK~
server$ curl -L http://127.0.0.1:8002/cmd/list
[]~
server$ curl -L http://127.0.0.1:8002/key1
{"error":"undefined"}~
```

## Android Universal Widget

In order to display key/values on your favourite android gadget you can install [Universal Widget](https://play.google.com/store/apps/details?id=uk.cdev.universalwidget.v1) and use following URL to catch your stored values.

```
$ curl -L http://127.0.0.1:8002/cmd/uw | jq .
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


