'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.dataforms = {};

  Restangular.all('dataforms').getList().then(function (list) {
    $scope.dataforms = list;
  });

  $scope.deleteForm = function (f) {
    Restangular.one('dataforms', f.uuid).remove().then(function () {
      var idx = $scope.dataforms.indexOf(f);
      $scope.dataforms.splice(idx, 1);
    }, function (response) {
      $scope.responseError = 'Error removing dataform: ' + response.statusText;
      $scope.responseErrorShow = true;
    }
  )};
};
