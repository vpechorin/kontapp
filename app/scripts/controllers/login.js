'use strict';

module.exports = function ($scope, $rootScope, $location, $cookieStore, Restangular) {
  $scope.rememberMe = true;
  $scope.responseErrorShow = false;
  $scope.responseError = '';

  $scope.login = function () {

    var credentials = {
      username: $scope.username,
      password: $scope.password
    };

    Restangular.all('user').customPOST(credentials,'authenticate').then( function(tokenContainer) {

      $rootScope.authToken = tokenContainer.token;
      if ($scope.rememberMe) {
        $cookieStore.put('authToken', tokenContainer.token);
      }
      // retrieve current user details
      Restangular.one('user').get().then(function (userData) {
        $rootScope.user = userData;
        $location.path('/');
      });

    }, function (response) {
      if (response.data) {
        if (response.data.message) {
          $scope.responseError = 'Error: ' + response.data.message;
        }
        else {
          $scope.responseError = 'Error: ' + response.data.error;
        }
      }
      else {
        $scope.responseError = 'Error: ' + response.statusText;
      }

      $scope.responseErrorShow = true;

      //console.log('Error with status code: ', response.status);
      //console.log('Error message: ', $scope.responseError);
    });

  };

};
