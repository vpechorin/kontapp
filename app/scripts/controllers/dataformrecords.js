'use strict';
var angular = require('angular');
var _= require('lodash');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.records = {};
  $scope.dataObjects = {};
  $scope.pageSize = 30;
  $scope.page = $stateParams.pageId ? $stateParams.pageId : 0;
  $scope.pages = [];
  $scope.totalPages = 1;
  $scope.resultPage = {};

  var pageMaker = function() {
    var pageNums = _.range(0, $scope.totalPages);
    $scope.pages = _.map(pageNums, function(pageNum) { return { num: pageNum, label: pageNum+1 }; });
  };

  var loadPage = function(pageNumber) {
    Restangular.one('dataforms', $stateParams.formId).customGET("records", {page: pageNumber, size: $scope.pageSize, sort: 'posted'}).then(function (data) {
      if (data.numberOfElements == 0) return;
      $scope.page = data.number;
      $scope.resultPage = data;
      $scope.totalPages = data.totalPages;
      pageMaker();
      $scope.dataObjects = _.map(data.content, function(rec) { return angular.fromJson(rec.data); });
      $scope.records = data.content;
    });
  }

  $scope.deleteRecord = function (rec) {
    console.log("delete click: " + rec.id);
    Restangular.one('dataforms', $stateParams.formId).one('records', rec.id).remove().then(function () {
      $state.go('dataforms.records', {formId: $stateParams.formId, pageId: $scope.page}, {reload: true});
    });
  };

  var checkPageNum = function(n) {
    if (n < 0) n = $scope.totalPages - 1;
    if (n >= $scope.totalPages) n = 0;
    if (n < 0) n = 0;
    return n;
  };

  $scope.prevPage = function() {
    var n = checkPageNum($scope.page - 1);
    loadPage(n);
  };

  $scope.nextPage = function() {
    var n = checkPageNum($scope.page + 1);
    loadPage(n);
  };

  $scope.gotoPage = function(p) {
    var n = checkPageNum(p);
    loadPage(n);
  };

  loadPage($scope.page);

};
