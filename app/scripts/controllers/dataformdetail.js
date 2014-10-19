'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.dataform = {};
  $scope.master = {};
  $scope.sites = {};

  Restangular.all('sites').getList().then(function (list) {
    $scope.sites = list;
  });

  Restangular.one('dataforms', $stateParams.formId).get().then(function (data) {
    $scope.dataform = data;
    $scope.master = angular.copy(data);
    if (!data.siteId) {
      if ($scope.sites) {
        $scope.dataform.siteId = $scope.sites[0].id;
      }
    }
  });

  $scope.update = function (dataform) {
    $scope.master = angular.copy(dataform);
    dataform.save();
  };

  $scope.reset = function () {
    $scope.dataform = angular.copy($scope.master);
  };

  $scope.deleteForm = function (dataform) {
    dataform.remove()
    .then(function () {
      $state.go('^', $stateParams, {reload: true});
    }, function (response) {
      $scope.responseError = 'Error: ' + response.statusText;
      $scope.responseErrorShow = true;
    });
  };

};
