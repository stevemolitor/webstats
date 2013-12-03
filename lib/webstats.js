'use strict';
/*jshint regexp: false */

var _ = require('underscore');
var byline = require('byline');
var histogram = require('./histogram');

var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var ONE_SECOND = 1000000;

function parseTimestamp(timestamp) {
  var groups = timestamp.match(/^(\d{2})\/([A-z][a-z]{2})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) (.\d{4})$/);
  var day = groups[1];
  var monthStr = groups[2];
  var month = MONTHS.indexOf(monthStr);
  var year = groups[3];
  var hour = groups[4];
  var minute = groups[5];
  var second = groups[6];
  var offset = groups[7];

  if (!month) {
    throw new Error('Unexpected month abbreviation', monthStr);
  }

  return new Date(year, month, day, hour, minute, second);
}

function parseLine(line) {
  line = line.toString();

  var groups = line.match(/\[(.+)\] "([A-Z]+) ([^ ]+)[^"]+" (\d+) (\d+) ("[^"]+") ("[^"]+") (\d+)/);
  if (!groups) return null;

  return {
    timestamp: parseTimestamp(groups[1]),
    method: groups[2],
    path: groups[3],
    status: groups[4],
    bytes: parseInt(groups[5], 10),
    micros: parseInt(groups[8], 10)
  };
}

function sum(name, stats) {
  return _.reduce(stats, function (tot, req) {
    return tot + parseInt(req[name], 10);
  }, 0);
}

function average(name, stats) {
  var total = sum(name, stats);
  return total / stats.length;
}

function microsToSecs(micros) {
  return micros / 1000000;
}

function pathCounts(requests) {
  var byPath = {};
  requests.forEach(function (req) {
    byPath[req.path] = byPath[req.path] || 0;
    byPath[req.path] += 1;
  });

  var counts = [];
  _.each(byPath, function (count, path) {
    counts.push({path: path, count: count});
  });

  return counts.sort(function (a, b) {
    return b.count - a.count;
  });
}

function analyzeRequests(requests) {
  // remove unparsable lines (nulls)
  requests = _.compact(requests);

  // only interested in successful GET requests
  requests = requests.filter(function (req) {
    return req.status === '200' && req.method === 'GET';
  });

  var bytesHistogram = histogram(ONE_SECOND);
  requests.forEach(function (req) {
    bytesHistogram.hit(req.micros, req.bytes);
  });

  var avgMicros = average('micros', requests);
  var avgBytes = average('bytes', requests);
  var totalBytes = sum('bytes', requests);
  var longest = _.max(requests, function (req) { return req.micros; }).micros;
  var largest = _.max(requests, function (req) { return req.bytes; }).bytes;

  var startTime = requests[0].timestamp;
  var endTime = requests[requests.length - 1].timestamp;
  var totalSeconds = (endTime - startTime) / 1000;

  var requestsPerSecond = requests.length / totalSeconds;
  var bytesPerSecond = totalBytes / totalSeconds;

  var maxRequestsPerSecond = _.max(bytesHistogram.bins, function (bin) {
    return bin.count;
  }).count;

  var maxBytesPerSecond = _.max(bytesHistogram.bins, function (bin) {
    return bin.total;
  }).total;

  var counts = pathCounts(requests);
  var topTen = counts.slice(0, 10);
  var uniqueRequests = counts.filter(function (obj) {
    return obj.count === 1;
  }).length;

  return {
    totalSeconds: totalSeconds,
    totalRequests: requests.length,
    averageTime: microsToSecs(avgMicros),
    averageBytes: avgBytes,
    longest: microsToSecs(longest),
    largest: largest,
    requestsPerSecond: requestsPerSecond,
    bytesPerSecond: bytesPerSecond,
    maxRequestsPerSecond: maxRequestsPerSecond,
    maxBytesPerSecond: maxBytesPerSecond,
    uniqueRequests: uniqueRequests,
    topTen: topTen
  };
}

module.exports = function (logStream, cb) {
  var lineStream = byline(logStream);
  lineStream.on('error', cb);

  var requests = [];
  lineStream.on('data', function (line) {
    requests.push(parseLine(line));
  });
  lineStream.on('end', function () {
    cb(null, analyzeRequests(requests));
  });
};
