'use strict';

module.exports = function ($scope, $state, $stateParams, Restangular) {
  Restangular.all('prerender').all('submit').doPOST([{}]);
};
