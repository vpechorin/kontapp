'use strict';

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.site = {};

  $scope.createNew = function (site) {
    Restangular.all('sites').post(site).then(function(newSite){
      //console.log("Success: site created");
      $state.go('sites.detail', { siteId: newSite.id}, {reload: true});
    }, function (response) {
      $scope.responseError = 'Error creating site: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    });
  };
};
