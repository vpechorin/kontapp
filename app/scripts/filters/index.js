'use strict';

var app = require('angular').module('kontApp');

app.filter('interpolate', function(version) {
  return function(text) {
    return String(text).replace(/\%VERSION\%/mg, version);
  };
});
