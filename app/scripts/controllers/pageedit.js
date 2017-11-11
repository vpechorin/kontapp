'use strict';
var angular = require('angular');
var _ = require('lodash');

module.exports = function ($scope, $state, $stateParams, Restangular, Upload, $interval, $timeout) {
    $scope.page = {};
    $scope.images = [];
    $scope.docfiles = [];
    $scope.embedimages = [];

    $scope.master = {};
    $scope.newPropName = '';
    $scope.newPropContent = '';

    $scope.editorOptions = {
        language: 'en'
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

    $scope.loadImages = function () {
        Restangular.one('pages', $stateParams.pageId).all('images').getList().then(function (list) {
            $scope.images = list;
        });
    };

    $scope.removeImage = function (img) {
        Restangular.one('pages', $stateParams.pageId).one('images', img.id).remove().then(function () {
            $scope.loadImages();
        });
    };

    $scope.imageUrl = function (img) {
        var l = '/att/' + $scope.page.siteId + img.directoryPath + '/' + img.name;
        return l;
    };

    $scope.thumbUrl = function (img) {
        if (img.thumb == null) {
            return '/images/282.gif';
        }
        else {
            return '/att/' + $scope.page.siteId + img.thumb.directoryPath + '/' + img.name;
        }
    };

    $scope.imgSetMain = function (img) {
        Restangular.one('pages', $stateParams.pageId).one('images', img.id).all('setmain').customPOST().then(function () {
            $scope.loadImages();
        });
    };

    $scope.imgMoveUp = function (img) {
        Restangular.one('pages', $stateParams.pageId).one('images', img.id).all('moveup').customPOST().then(function () {
            $scope.loadImages();
        });
    };

    $scope.imgMoveDown = function (img) {
        Restangular.one('pages', $stateParams.pageId).one('images', img.id).all('movedown').customPOST().then(function () {
            $scope.loadImages();
        });
    };

    $scope.onImageSelect = function (files, errFiles) {
        if (files && files.length) {
            angular.forEach(files, function (file) {
                file.upload = Upload.upload({
                    url: '/api/pages/' + $stateParams.pageId + '/images',
                    data: {file: file}
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                    $scope.loadUploadedImages();
                }, function (response) {
                    console.log("Response: " + response);
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    console.log('progress: ' + file.name + ' - ' + file.progress);
                });
            });
        }
    };

    var pollers = {};

    var refreshImgData = function (img) {
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

    var replaceImg = function (newImg) {
        var pos = _.findIndex($scope.images, {'id': newImg.id});
        $scope.images[pos] = newImg;
        //$scope.images.splice(pos, 1);
        //$scope.images.splice(pos, 0, newImg);
    };

    $scope.loadUploadedImages = function () {
        Restangular.one('pages', $stateParams.pageId).all('images').getList().then(function (list) {
            $scope.images = list;
            angular.forEach($scope.images, function (img, idx) {
                //console.log("img.thumb: " + img.thumb);
                if ((img.thumb == null) || (typeof img.thumb == undefined)) {
                    if (!angular.isDefined(pollers[img.id])) {
                        //console.log("Image uploaded, but thumbnail is not generated yet, set polling for: " + img.id + "/" + img.name);
                        // pollers[img.id] = $interval(refreshImgData(img), 500);
                        pollers[img.id] = $interval(function () {
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

    $scope.$on('$destroy', function () {
        _.forEach(pollers, function (poller) {
            if (angular.isDefined(poller)) {
                $interval.cancel(poller);
                poller = undefined;
            }
        });
        pollers = undefined;
    });

    $scope.onFileSelect = function (files, errFiles) {
        if (files && files.length) {
            angular.forEach(files, function (file) {
                file.upload = Upload.upload({
                    url: '/api/pages/' + $stateParams.pageId + '/files',
                    data: {file: file}
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                    $scope.loadFiles();
                }, function (response) {
                    console.log("Response: " + response);
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    console.log('progress: ' + file.name + ' - ' + file.progress);
                });
            });
        }
    };

    $scope.fileMoveUp = function (img) {
        Restangular.one('pages', $stateParams.pageId).one('files', img.id).all('moveup')
            .customPOST().then(function () {
            $scope.loadFiles();
        });
    };

    $scope.fileMoveDown = function (img) {
        Restangular.one('pages', $stateParams.pageId).one('files', img.id).all('movedown')
            .customPOST().then(function () {
            $scope.loadFiles();
        });
    };

    $scope.saveFile = function (df) {
        df.put();
    };

    $scope.loadFiles = function () {
        Restangular.one('pages', $stateParams.pageId).all('files').getList().then(function (list) {
            $scope.docfiles = list;
        });
    };

    $scope.loadFiles();
    $scope.loadImages();

    $scope.removeFile = function (df) {
        Restangular.one('pages', $stateParams.pageId).one('files', df.id).remove().then(function () {
            $scope.loadFiles();
        });
    };

    $scope.fileUrl = function (df) {
        var l = '/att/' + $scope.page.siteId + df.directoryPath + '/' + df.name;
        return l;
    };

    // ------------------------------
    $scope.onEmbedImageSelect = function (files, errFiles) {
        if (files && files.length) {
            angular.forEach(files, function (file) {
                file.upload = Upload.upload({
                    url: '/api/pages/' + $stateParams.pageId + '/embed',
                    data: {file: file}
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                    $scope.loadEmbedImages();
                }, function (response) {
                    console.log("Response: " + response);
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    console.log('progress: ' + file.name + ' - ' + file.progress);
                });
            });
        }
    };

    $scope.loadEmbedImages = function () {
        Restangular.one('pages', $stateParams.pageId).all('embed').getList().then(function (list) {
            $scope.embedimages = list;
        });
    };

    $scope.loadEmbedImages();

    $scope.removeEmbedImage = function (emb) {
        Restangular.one('pages', $stateParams.pageId).one('embed', emb.id).remove().then(function () {
            $scope.loadEmbedImages();
        });
    };

    $scope.embedImageUrl = function (emb) {
        var l = '/att/' + $scope.page.siteId + emb.directoryPath + '/' + emb.name;
        return l;
    };

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
