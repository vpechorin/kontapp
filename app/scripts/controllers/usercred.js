'use strict';

module.exports = function ($scope, $state, $stateParams, Restangular) {
  Restangular.one('users', $stateParams.userId).getList('credentials').then(function (creds) {
    $scope.credentials = creds;
  });

  $scope.removeCredential = function (credential) {

  };
};
