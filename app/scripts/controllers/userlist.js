'use strict';

module.exports = function ($scope, Restangular) {
  Restangular.all('users').getList().then(function (list) {
    $scope.users = list;
  });
};
