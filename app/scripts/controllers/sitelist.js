'use strict';

module.exports = function ($scope, Restangular) {
  Restangular.all('sites').getList().then(function (list) {
    $scope.sites = list;
  });
};
