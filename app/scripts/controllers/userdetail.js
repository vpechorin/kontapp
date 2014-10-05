'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.user = {};
  $scope.master = {};

  Restangular.one('users', $stateParams.userId).get().then(function (user) {
    $scope.user = user;
    $scope.master = angular.copy(user);
  });

  $scope.updateRoles = function () {
    if ($scope.user.roleMap) {
      var roles = [];
      var role;
      for (role in $scope.user.roleMap) {
        if ($scope.user.roleMap[role]) { roles.push(role); }
      }
      $scope.user.roles = roles;
    }
  };

  $scope.$watch('user.roleMap.editor', function () {
    $scope.updateRoles();
  });
  $scope.$watch('user.roleMap.admin', function () {
    $scope.updateRoles();
  });
  $scope.$watch('user.roleMap.user', function () {
    $scope.updateRoles();
  });

  $scope.update = function (user) {
    $scope.master = angular.copy(user);
    user.save();

  };

  $scope.deleteUser = function (user) {
    user.remove()
    .then(function () {
      //console.log("Success");
      $state.go('^', $stateParams, {reload: true});
    }, function (response) {
      $scope.responseError = 'Error: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    });
  };

  $scope.reset = function () {
    $scope.user = angular.copy($scope.master);
  };

  $scope.isUnchanged = function (user) {
    return angular.equals(user, $scope.master);
  };

  $scope.reset();

};
