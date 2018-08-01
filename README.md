# statful-traffic-splitter [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url]

this component listens to [traffic-splitter](https://www.npmjs.com/package/traffic-splitter) events and sends metrics to [statful](https://statful.com) with [statful-client](https://www.npmjs.com/package/statful-client).

## How to

```javascript
const Statful = require('statful-client')
const TrafficSplitter = require('traffic-splitter')
const StatfulTrafficSplitter = require('statful-traffic-splitter')

const statful = new Statful(/*statful config*/)
const splitter = new TrafficSplitter(/*splitter config*/)

StatfulTrafficSplitter(statful, splitter)
```

[npm-image]: https://img.shields.io/npm/v/statful-traffic-splitter.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/statful-traffic-splitter
[travis-image]: https://travis-ci.org/Mindera/statful-traffic-splitter.svg?branch=master
[travis-url]: https://travis-ci.org/Mindera/statful-traffic-splitter
