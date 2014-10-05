'use strict';

module.exports = function ($scope, $stateParams, Restangular) {
  Restangular.one('users', $stateParams.userId).getList('authtokens').then(function (tokens) {
    $scope.authtokens = tokens;
  });

  $scope.getToken = function (token) {
    //console.log("Token: " + token.uuid);
    Restangular.one('users', $stateParams.userId).one('authtokens', token.uuid).get().then(function (t) {
      $scope.authtoken = t;
    });
  };

  $scope.removeToken = function (token) {
    //console.log("Remove token: " + token.uuid);
    Restangular.one('users', $stateParams.userId).one('authtokens', token.uuid).remove();
    var idx = $scope.authtokens.indexOf(token);
    $scope.authtokens.splice(idx, 1);
  };
};
