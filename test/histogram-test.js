'use strict';

var chai = require('chai');
var expect = chai.expect;
var histogram = require('../lib/histogram');

chai.Assertion.includeStack = true;

describe('histogram', function () {
  it('should put things in bins', function () {
    var hist = histogram(1.0);

    hist.hit(1.0, 2);
    hist.hit(1.9, 4);
    hist.hit(2.1, 4);
    hist.hit(2.9, 8);

    var bins = hist.bins;
    expect(Object.keys(bins).length).to.equal(2);

    expect(bins[0].startTime).to.equal(1.0);
    expect(bins[0].count).to.equal(2);
    expect(bins[0].average).to.equal(3);

    expect(bins[1].startTime).to.equal(2.0);
    expect(bins[1].count).to.equal(2);
    expect(bins[1].average).to.equal(6);
  });
});
