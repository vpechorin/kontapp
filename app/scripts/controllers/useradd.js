'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.user = {
    roleMap: {
      admin: false,
      editor: false,
      user: true
    },
    roles: ['user']
  };
  $scope.master = {};

  $scope.responseError = '';
  $scope.responseErrorShow = false;

  $scope.updateRoles = function () {
    if ($scope.user.roleMap) {
      var roles = [];
      var role = '';
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
    Restangular.all('users').post({
      name: user.name,
      email: user.email,
      password: user.password,
      roles: user.roles
    })
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
