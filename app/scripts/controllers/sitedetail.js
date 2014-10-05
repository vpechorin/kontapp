'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.site = {};
  $scope.master = {};
  $scope.selectedSiteIndex = $stateParams.siteId;
  $scope.newPropName = '';
  $scope.newPropContent = '';

  Restangular.one('sites', $stateParams.siteId).get().then(function (data) {
    $scope.site = data;
    $scope.master = angular.copy(data);
  });

  $scope.update = function (site) {
    $scope.master = angular.copy(site);
    site.save();
  };

  $scope.reset = function () {
    $scope.site = angular.copy($scope.master);
  };

  $scope.isUnchanged = function (site) {
    return angular.equals(site, $scope.master);
  };

  $scope.deleteSite = function (site) {
    site.remove()
    .then(function () {
      //console.log("Success");
      $state.go('^', $stateParams, {reload: true});
    }, function (response) {
      $scope.responseError = 'Error: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log('Error with status code: ', response.status);
    });
  };

  $scope.addProp = function () {
    var siteProperty = {
      name: $scope.newPropName,
      content: $scope.newPropContent
    };
    Restangular.one('sites', $stateParams.siteId).customPOST(siteProperty).then(function (updatedSite) {
      // console.log("Success - property created");
      $scope.site.properties = updatedSite.properties;
      $scope.site.propertyMap = updatedSite.propertyMap;
      $scope.newPropName = '';
      $scope.newPropContent = '';
    }, function (response) {
      $scope.responseError = 'Error creating property: ' + response.statusText;
      $scope.responseErrorShow = true;
      // console.log("Error with status code: ", response.status);
    }
                                                                               );
  };

  $scope.saveProp = function (prop) {
    Restangular.one('sites', $stateParams.siteId).all(prop.id).customPUT(prop).then(function () {
      //console.log("Success - property saved");
    }, function (response) {
      $scope.responseError = 'Error saving property: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                                                   );
  };

  $scope.deleteProp = function (prop) {
    Restangular.one('sites', $stateParams.siteId).all(prop.name).remove().then(function () {
      var idx = $scope.site.properties.indexOf(prop);
      $scope.site.properties.splice(idx, 1);
      //console.log("Success - property removed");
    }, function (response) {
      $scope.responseError = 'Error removing property: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                                              );
  };
};
