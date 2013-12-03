'use strict';
/*jshint expr: true */

var chai = require('chai');
var expect = chai.expect;
var webstats = require('../lib/webstats');
var fs = require('fs');
var path = require('path');

chai.Assertion.includeStack = true;

describe('webstats', function () {
  it('should compute stats for successful GET requests', function (done) {
    var logFile = path.resolve(__dirname, 'access.log');
    var logStream = fs.createReadStream(logFile);

    webstats(logStream, function (err, stats) {
      expect(err).to.not.exist;
      expect(stats.totalSeconds).closeTo(1, 0.01);
      expect(stats.totalRequests).to.equal(3);
      expect(stats.bytesPerSecond).closeTo(42238, 1);
      expect(stats.requestsPerSecond).closeTo(3.0, 0.1);
      expect(stats.averageBytes).closeTo(14079.33, 1);
      expect(stats.averageTime).closeTo(0.008389, 0.000001);
      expect(stats.longest).closeTo(0.010795, 0.000001);
      expect(stats.largest).to.equal(26953);
      expect(stats.maxBytesPerSecond).to.equal(42239);
      expect(stats.maxRequestsPerSecond).to.equal(3);
      expect(stats.uniqueRequests).to.equal(3);
      expect(stats.topTen.length).to.equal(3);
      done();
    });
  });
});
