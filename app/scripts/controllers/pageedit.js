'use strict';
var angular = require('angular');
var _ = require('lodash');

module.exports = function ($scope, $state, $stateParams, Restangular, $upload,  $interval) {
  $scope.page = {};
  $scope.images = [];
  $scope.docfiles = [];
  $scope.embedimages = [];
  $scope.dataforms = [];

  $scope.master = {};
  $scope.newPropName = '';
  $scope.newPropContent = '';

  $scope.editorOptions = {
    language: 'en'
  };

  $scope.loadForms = function() {
    Restangular.all('dataforms').getList({siteId: $scope.page.siteId }).then(function (list) {
      $scope.dataforms = list;
    });
  };

  Restangular.one('pages', $stateParams.pageId).get().then(function (data) {
    $scope.page = data;
    $scope.master = angular.copy(data);
  });

  $scope.$watch('page.title', function () {
    if ($scope.page.autoName) {
      var txt = $scope.page.title + '';
      var newName = txt.replace(/\W/g, '').toLowerCase();
      $scope.page.name = newName;
    }
  });

  $scope.update = function (page) {
    $scope.master = angular.copy(page);
    page.save();
  };

  $scope.reset = function () {
    $scope.page = angular.copy($scope.master);
  };

  $scope.isUnchanged = function (page) {
    return angular.equals(page, $scope.master);
  };

  $scope.loadImages = function() {
    Restangular.one('pages', $stateParams.pageId).all('images').getList().then(function (list) {
      $scope.images = list;
    });
  };

  $scope.removeImage = function(img) {
    Restangular.one('pages', $stateParams.pageId).one('images', img.id).remove().then(function () {
      $scope.loadImages();
    });
  };

  $scope.imageUrl = function(img) {
    var l = '/att/' + $scope.page.siteId + img.directoryPath + '/' + img.name;
    return l;
  };

  $scope.thumbUrl = function(img) {
    if (img.thumb == null) {
      return '/images/282.gif';
    }
    else {
      return '/att/' + $scope.page.siteId + img.thumb.directoryPath + '/' + img.name;
    }
  };

  $scope.imgSetMain = function(img) {
    Restangular.one('pages', $stateParams.pageId).one('images', img.id).all('setmain').customPOST().then(function () {
      $scope.loadImages();
    });
  };

  $scope.imgMoveUp = function(img) {
    Restangular.one('pages', $stateParams.pageId).one('images', img.id).all('moveup').customPOST().then(function () {
      $scope.loadImages();
    });
  };

  $scope.imgMoveDown = function(img) {
    Restangular.one('pages', $stateParams.pageId).one('images', img.id).all('movedown').customPOST().then(function () {
      $scope.loadImages();
    });
  };

  $scope.onImageSelect = function ($files) {
    //$files: an array of files selected, each file has name, size, and type.
    $scope.selectedFiles = [];
    $scope.progress = [];
    if ($scope.upload && $scope.upload.length > 0) {
      for (var i = 0; i < $scope.upload.length; i++) {
        if ($scope.upload[i] != null) {
          $scope.upload[i].abort();
        }
      }
    }
    $scope.upload = [];
    $scope.uploadResult = [];
    $scope.selectedFiles = $files;
    $scope.dataUrls = [];
    for (var it = 0; it < $files.length; it++) {
      var file = $files[it];
      $scope.upload = $upload.upload({
        url: '/api/pages/' + $stateParams.pageId + '/images',
        method: 'POST',
        // method: 'POST' or 'PUT',
        // headers: {'header-key': 'header-value'},
        // withCredentials: true,
        data: { fileNum: it },
        file: file
        // or list of files: $files for html5 only
        /* set the file formData name ('Content-Desposition'). Default is 'file' */
        //fileFormDataName: myFile, //or a list of names for multiple files (html5).
        /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
        //formDataAppender: function(formData, key, val){}
      }).progress(function (evt) {
        $scope.progress[it] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        //console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      }).success(function (data, status, headers, config) {
        // file is uploaded successfully
        //console.log("file uploaded successfully: " + data);
        $scope.uploadResult.push(data);
        $scope.loadUploadedImages();
      })
      .xhr(function(xhr) {
        xhr.upload.addEventListener('abort', function() {
        // console.log('abort complete')
        }, false )}
      );
    }
    /* alternative way of uploading, send the file binary with the file's content-type.
                 Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
                 It could also be used to monitor the progress of a normal http post/put request with large data*/
    // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
  };

  var pollers = {};

  var refreshImgData = function(img) {
    //console.log("Poll for new data for:" + img.id + '/' + img.name);

    Restangular.one('pages', $stateParams.pageId).one('images', img.id).get().then(function (data) {
      if (data.thumb != null) {
        // console.log('Thumb generated for: ' + data.name + '/' + data.id);
        img = data;
        var imgId = data.id;
        var promise = pollers[imgId];
        if (angular.isDefined(promise)) {
          $interval.cancel(promise);
          promise = undefined;
          pollers[imgId] = undefined;
          delete pollers[imgId];
          // console.log('Poller removed for: ' + data.name + '/' + data.id);
        }
      }
    });
  };

  var replaceImg = function(newImg) {
    var pos = _.findIndex($scope.images, { 'id': newImg.id });
    //console.log("Found index: " + pos);
    $scope.images[pos] = newImg;
    //$scope.images.splice(pos, 1);
    //$scope.images.splice(pos, 0, newImg);
  };

  $scope.loadUploadedImages = function() {
    Restangular.one('pages', $stateParams.pageId).all('images').getList().then(function (list) {
      $scope.images = list;
      angular.forEach($scope.images, function(img, idx) {
        //console.log("img.thumb: " + img.thumb);
        if ((img.thumb == null) || (typeof img.thumb == undefined)) {
          if (!angular.isDefined(pollers[img.id])) {
            //console.log("Image uploaded, but thumbnail is not generated yet, set polling for: " + img.id + "/" + img.name);
            // pollers[img.id] = $interval(refreshImgData(img), 500);
            pollers[img.id] = $interval(function() {
              // console.log("Poll for new data for:" + img.id + '/' + img.name);
              Restangular.one('pages', $stateParams.pageId).one('images', img.id).get().then(function (data) {
                if (data.thumb != null) {
                  //console.log("Thumb generated for: " + data.name + "/" + data.id);
                  replaceImg(data);
                  var imgId = data.id;
                  if (angular.isDefined(pollers[imgId])) {
                    $interval.cancel(pollers[imgId]);
                    pollers[imgId] = undefined;
                    delete pollers[imgId];
                    //console.log("Poller removed for: " + data.name + "/" + data.id);
                  }
                }
              });
            }, 1000);
          }
        }
      });
    });
  };

  $scope.$on('$destroy', function() {
    _.forEach(pollers, function(poller) {
      if (angular.isDefined(poller)) {
        $interval.cancel(poller);
        poller = undefined;
      }
    });
    pollers = undefined;
  });

  $scope.onFileSelect = function ($files) {
    //$files: an array of files selected, each file has name, size, and type.
    $scope.selectedFiles = [];
    $scope.progress = [];
    if ($scope.upload && $scope.upload.length > 0) {
      for (var i = 0; i < $scope.upload.length; i++) {
        if ($scope.upload[i] != null) {
          $scope.upload[i].abort();
        }
      }
    }
    $scope.upload = [];
    $scope.uploadResult = [];
    $scope.selectedFiles = $files;
    $scope.dataUrls = [];
    for (var it = 0; it < $files.length; it++) {
      var file = $files[it];
      $scope.upload = $upload.upload({
        url: '/api/pages/' + $stateParams.pageId + '/files',
        method: 'POST',
        // method: 'POST' or 'PUT',
        // headers: {'header-key': 'header-value'},
        // withCredentials: true,
        data: {fileNum: it},
        file: file
        // or list of files: $files for html5 only
        /* set the file formData name ('Content-Desposition'). Default is 'file' */
        //fileFormDataName: myFile, //or a list of names for multiple files (html5).
        /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
        //formDataAppender: function(formData, key, val){}
      }).progress(function (evt) {
        $scope.progress[it] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        //console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      }).success(function (data, status, headers, config) {
        // file is uploaded successfully
        $scope.uploadResult.push(data);
        $scope.loadFiles();
      })
      //.error(...)
      //.then(success, error, progress);
      .xhr(
        function (xhr) {
          xhr.upload.addEventListener('abort', function() {
            //console.log('abort complete');
          }, false)});
    }
    /* alternative way of uploading, send the file binary with the file's content-type.
                 Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
                 It could also be used to monitor the progress of a normal http post/put request with large data*/
    // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
  };

  $scope.fileMoveUp = function(img) {
    Restangular.one('pages', $stateParams.pageId).one('files', img.id).all('moveup')
    .customPOST().then(function () {
      $scope.loadFiles();
    });
  };

  $scope.fileMoveDown = function(img) {
    Restangular.one('pages', $stateParams.pageId).one('files', img.id).all('movedown')
    .customPOST().then(function () {
      $scope.loadFiles();
    });
  };

  $scope.saveFile = function(df) {
    df.put();
  };

  $scope.loadFiles = function() {
    Restangular.one('pages', $stateParams.pageId).all('files').getList().then(function (list) {
      $scope.docfiles = list;
    });
  };

  $scope.loadFiles();
  $scope.loadImages();
  $scope.loadForms();

  $scope.removeFile = function(df) {
    Restangular.one('pages', $stateParams.pageId).one('files', df.id).remove().then(function () {
      $scope.loadFiles();
    });
  };

  $scope.fileUrl = function(df) {
    var l = '/att/' + $scope.page.siteId + df.directoryPath + '/' + df.name;
    return l;
  };

  // ------------------------------

  $scope.onEmbedImageSelect = function ($files) {
    //$files: an array of files selected, each file has name, size, and type.
    $scope.selectedFiles = [];
    $scope.progress = [];
    if ($scope.upload && $scope.upload.length > 0) {
      for (var i = 0; i < $scope.upload.length; i++) {
        if ($scope.upload[i] != null) {
          $scope.upload[i].abort();
        }
      }
    }
    $scope.upload = [];
    $scope.uploadResult = [];
    $scope.selectedFiles = $files;
    $scope.dataUrls = [];
    for (var it = 0; it < $files.length; it++) {
      var file = $files[it];
      $scope.upload = $upload.upload({
        url: '/api/pages/' + $stateParams.pageId + '/embed',
        method: 'POST',
        data: {fileNum: it},
        file: file
      }).progress(function (evt) {
        $scope.progress[it] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        //console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      }).success(function (data, status, headers, config) {
        $scope.uploadResult.push(data);
        $scope.loadEmbedImages();
      })
      .xhr(
        function (xhr) {
          xhr.upload.addEventListener('abort', function() {
            //console.log('abort complete');
          }, false)});
    }
  };

  $scope.loadEmbedImages = function() {
    Restangular.one('pages', $stateParams.pageId).all('embed').getList().then(function (list) {
      $scope.embedimages = list;
    });
  };

  $scope.loadEmbedImages();

  $scope.removeEmbedImage = function(emb) {
    Restangular.one('pages', $stateParams.pageId).one('embed', emb.id).remove().then(function () {
      $scope.loadEmbedImages();
    });
  };

  $scope.embedImageUrl = function(emb) {
    var l = '/att/' + $scope.page.siteId + emb.directoryPath + '/' + emb.name;
    return l;
  };

  // ------------------------------


  $scope.addProp = function (localScope) {
    var pageProperty = {
      name: localScope.newPropName,
      content: localScope.newPropContent
    };
    Restangular.one('pages', $stateParams.pageId).all('properties')
      .customPOST(pageProperty).then(function (updatedPage) {
      //console.log("Success - property created");
      $scope.page.properties = updatedPage.properties;
      $scope.page.propertyMap = updatedPage.propertyMap;
      localScope.newPropName = '';
      localScope.newPropContent = '';
      $scope.master.properties = angular.copy(updatedPage.properties);
      //$scope.master.properties = Restangular.copy(updatedPage.properties);
    }, function (response) {
      $scope.responseError = 'Error creating property: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                                                                 );
  };

  $scope.saveProp = function (prop) {
    Restangular.one('pages', $stateParams.pageId).one('properties', prop.id)
      .customPUT(prop).then(function () {
      //console.log("Success - property saved");
    }, function (response) {
      $scope.responseError = 'Error saving property: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                                                                 );
  };

  $scope.deleteProp = function (prop) {
    Restangular.one('pages', $stateParams.pageId).one('properties', prop.id).remove().then(function () {
      var idx = $scope.page.properties.indexOf(prop);
      $scope.page.properties.splice(idx, 1);
      //console.log("Success - property removed");
    }, function (response) {
      $scope.responseError = 'Error removing property: ' + response.statusText;
      $scope.responseErrorShow = true;
      //console.log("Error with status code: ", response.status);
    }
                                                                                          );
  };

  $scope.reset();
};
