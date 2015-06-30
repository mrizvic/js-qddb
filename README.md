# QDDB - quick and dirty database

I needed simple and RESTful key/value so I ended up writing this.
Each stored key has a property of created, modified and accessed timestamp in ISO 8601 format.

SIGUSR2 signal handler is written to produce some statistics on console.log()


## Usage:

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

![QDDB.js and Univeral Widget in action](https://raw.github.com/mrizvic/js-qddb/universalwidget.png)


