'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.dataform = {};
  $scope.master = {};
  $scope.sites = {};

  Restangular.all('sites').getList().then(function (list) {
    $scope.sites = list;
    if (list) {
      $scope.dataform.siteId = list[0].id;
    }
  });

  $scope.createNew = function (dataform) {
    Restangular.all('dataforms').post(dataform).then(function(newForm){
      $state.go('dataforms.detail', { formId: newForm.id}, {reload: true});
    }, function (response) {
      $scope.responseError = 'Error creating dataform: ' + response.statusText;
      $scope.responseErrorShow = true;
    });
  };

};
