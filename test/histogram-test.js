'use strict';

var chai = require('chai');
var expect = chai.expect;

chai.Assertion.includeStack = true;

describe('histogram', function () {
  it('should put things in bins', function () {
    expect(2).to.equal(2);
  });
});
