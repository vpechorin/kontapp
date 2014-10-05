'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  //console.log("stateParams: " + $stateParams);
  Restangular.one('users', $stateParams.userId).one('credentials', $stateParams.credId)
  .customGET('chpassword').then(function (formdata) {
    $scope.passwordData = formdata;
    $scope.master = angular.copy($scope.passwordData);
  });

  $scope.responseError = '';
  $scope.responseErrorShow = false;

  $scope.master = {};

  $scope.update = function (passwordData) {
    $scope.master = angular.copy(passwordData);
    Restangular
    .one('users', $stateParams.userId)
    .one('credentials', $stateParams.credId)
    .all('chpassword')
    .customPUT($scope.passwordData).then(function () {
      //console.log("Success");
      $state.go('^');
    }, function (response) {
      $scope.responseError = 'Error: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    });

    //$scope.passwordData.customPUT("chpassword");
  };

  $scope.reset = function () {
    $scope.passwordData = angular.copy($scope.master);
  };

  $scope.isUnchanged = function (passwordData) {
    return angular.equals(passwordData, $scope.master);
  };

  $scope.reset();
};
