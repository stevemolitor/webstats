'use strict';

function makeBin() {
  var bin = {
    count: 0,
    total: 0
  };

  Object.defineProperty(bin, 'average', {get: function () {
    return this.total / this.count;
  }});

  return bin;
}

module.exports = function (interval) {
  var binsMap = {};

  var histogram = {
    hit: function (time, value) {
      var key = time - (time % interval);
      binsMap[key] = binsMap[key] || makeBin();
      binsMap[key].count += 1;
      binsMap[key].total += value;
    }
  };

  Object.defineProperty(histogram, 'bins', {get: function () {
    var bins = [];
    var binKeys = Object.keys(binsMap).sort();

    binKeys.forEach(function (key) {
      var bin = binsMap[key];
      bin.startTime = parseInt(key, 10);
      bins.push(bin);
    });

    return bins;
  }});

  return histogram;
};
