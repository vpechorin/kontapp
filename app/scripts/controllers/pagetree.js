'use strict';
var angular = require('angular');

module.exports = function ($scope, $state, $stateParams, Restangular) {
  $scope.data = {};
  Restangular.one('pagetrees', $stateParams.siteId).getList().then(function (list) {
    $scope.data = list;
  });

  $scope.treeOptions = {
    accept: function(sourceNodeScope, destNodesScope, destIndex) {
      return true;
    },
    dropped: function(event) {
      var srcPageId =  event.source.nodeScope.$modelValue.id;
      var srcParentId = 0;
      if (event.source.nodeScope.$parentNodeScope != null) {
        srcParentId = event.source.nodeScope.$parentNodeScope.$modelValue.id;
      }
      var srcIndex = event.source.index;
      var dstParentId = 0;
      if (event.dest.nodesScope.$parent.$modelValue) {
        dstParentId = event.dest.nodesScope.$parent.$modelValue.id;
      }
      var dstIndex = event.dest.index;
      //console.log("dropped event: page #" + srcPageId + " moved from parent #" + srcParentId + " to parent #" + dstParentId);
      //console.log("index changed: " + srcIndex + " to " + dstIndex);
      if ((dstIndex !== srcIndex) || (dstParentId !== srcParentId)) {
        Restangular.one('pages', srcPageId).all('move')
        .customPOST({ srcParentId: srcParentId, dstParentId: dstParentId, srcIndex: srcIndex, dstIndex: dstIndex});
      }
    }
  };

  $scope.reloadTree = function() {
    Restangular.one('pagetrees', $stateParams.siteId).getList().then(function (list) {
      $scope.data = list;
    });
  };

  $scope.editPage = function (scope) {
    var nodeData = scope.$modelValue;
    $state.go('^.pages', {siteId: $stateParams.siteId, pageId: nodeData.id});
  };

  $scope.removePage = function (scope) {
    var nodeData = scope.$modelValue;
    //console.log("remove page: " + nodeData.id + "/" + nodeData.title);
    Restangular.one('pages', nodeData.id).customDELETE().then(function () {
      scope.remove();
      //console.log("Success - page removed");
    }, function (response) {
      $scope.responseError = 'Error removing page: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                             );

  };

  $scope.toggle = function(scope) {
    //console.log("toggle");
    scope.toggle();
  };

  $scope.moveLastToTheBeginning = function () {
    var a = $scope.data.pop();
    $scope.data.splice(0,0, a);
  };

  $scope.newRootPage = function() {
    if ($scope.data == null) { $scope.data = []; }
    var newPage = {
      siteId: $stateParams.siteId,
      parentId: 0,
      title: 'New page.' + ($scope.data.length + 1),
      name: 'newpage' + ($scope.data.length + 1),
      publicPage: false,
      placeholder: false
    };
    Restangular.all('pages').customPOST(newPage).then(function () {
      //console.log("Success - page created");
      $scope.reloadTree();
    }, function (response) {
      $scope.responseError = 'Error creating new root page: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                     );
  };

  $scope.newSubItem = function(scope) {
    var nodeData = scope.$modelValue;
    if (nodeData.nodes == null) { nodeData.nodes = []; }

    var newPage = {
      siteId: $stateParams.siteId,
      parentId: nodeData.id,
      title: nodeData.title + '.' + (nodeData.nodes.length + 1),
      name: nodeData.title + (nodeData.nodes.length + 1),
      publicPage: false,
      placeholder: false
    };
    Restangular.all('pages').customPOST(newPage).then(function (newPage) {
      //console.log("Success - page created");

      nodeData.nodes.push({
        id: newPage.id,
        title: newPage.title,
        nodes: []
      });
    }, function (response) {
      $scope.responseError = 'Error creating new page: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                     );
  };

  var getRootNodesScope = function() {
    return angular.element(document.getElementById('tree-root')).scope();
  };

  $scope.collapseAll = function() {
    var scope = getRootNodesScope();
    scope.collapseAll();
  };

  $scope.expandAll = function() {
    var scope = getRootNodesScope();
    scope.expandAll();
  };
};
