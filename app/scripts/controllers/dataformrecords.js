'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.records = {};

  Restangular.one('dataforms', $stateParams.formId).get().then(function (data) {
    $scope.dataform = data;
  });

  $scope.update = function (rec) {
    dataform.save();
  };

  $scope.reset = function () {
    $scope.dataform = angular.copy($scope.master);
  };

  $scope.deleteRecord = function (rec) {
    rec.remove()
    .then(function () {
      $state.go('^', $stateParams, {reload: true});
    }, function (response) {
      $scope.responseError = 'Error: ' + response.statusText;
      $scope.responseErrorShow = true;
    });
  };

};
