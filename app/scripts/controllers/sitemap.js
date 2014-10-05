'use strict';

module.exports = function ($scope, $state, $stateParams, Restangular) {
  Restangular.all('sitemaps').all($stateParams.actionName).doPOST([{}]);
};
