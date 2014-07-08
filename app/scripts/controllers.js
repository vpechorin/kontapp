'use strict';

/* Controllers */

angular.module('kontApp.controllers', [])
.controller('LoginController', ['$scope', '$rootScope', '$location', '$cookieStore', 'UserService',
        function ($scope, $rootScope, $location, $cookieStore, UserService) {
            $scope.rememberMe = false;
            $scope.login = function () {
                UserService.authenticate($.param({username: $scope.username, password: $scope.password}),
                    function (authenticationResult) {
                        console.log("auth Result: " + authenticationResult);
                        var authToken = authenticationResult.token;
                        $rootScope.authToken = authToken;
                        if ($scope.rememberMe) {
                            $cookieStore.put('authToken', authToken);
                        }
                        UserService.get(function (user) {
                            $rootScope.user = user;
                            $location.path("/");
                        });
                    });
            };
        }])
    .controller('PageTreeController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
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
                console.log("dropped event: page #" + srcPageId + " moved from parent #" + srcParentId + " to parent #" + dstParentId);
                console.log("index changed: " + srcIndex + " to " + dstIndex);
                if ((dstIndex != srcIndex) || (dstParentId != srcParentId)) {
                    Restangular.one('pages', srcPageId).all('move').customPOST({ srcParentId: srcParentId, dstParentId: dstParentId, srcIndex: srcIndex, dstIndex: dstIndex});
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
            $state.go("^.pages", {siteId: $stateParams.siteId, pageId: nodeData.id});
        };

        $scope.removePage = function (scope) {
            var nodeData = scope.$modelValue;
            console.log("remove page: " + nodeData.id + "/" + nodeData.title);
            Restangular.one('pages', nodeData.id).customDELETE().then(function () {
                    scope.remove();
                    console.log("Success - page removed");
                }, function (response) {
                    $scope.responseError = "Error removing page: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                }
            );

        };

        $scope.toggle = function(scope) {
            console.log("toggle");
            scope.toggle();
        };

        $scope.moveLastToTheBegginig = function () {
            var a = $scope.data.pop();
            $scope.data.splice(0,0, a);
        };

        $scope.newRootPage = function() {
            if ($scope.data == null) $scope.data=[];
            var newPage = {
                siteId: $stateParams.siteId,
                parentId: 0,
                title: 'New page.' + ($scope.data.length + 1),
                name: 'newpage' + ($scope.data.length + 1),
                publicPage: false,
                placeholder: false
            };
            Restangular.all('pages').customPOST(newPage).then(function (newPage) {
                    console.log("Success - page created");
                    $scope.reloadTree();
                }, function (response) {
                    $scope.responseError = "Error creating new root page: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                }
            );
        };

        $scope.newSubItem = function(scope) {
            var nodeData = scope.$modelValue;
            if (nodeData.nodes == null) nodeData.nodes=[];

            var newPage = {
                siteId: $stateParams.siteId,
                parentId: nodeData.id,
                title: nodeData.title + '.' + (nodeData.nodes.length + 1),
                name: nodeData.title + (nodeData.nodes.length + 1),
                publicPage: false,
                placeholder: false
            };
            Restangular.all('pages').customPOST(newPage).then(function (newPage) {
                    console.log("Success - page created");

                    nodeData.nodes.push({
                        id: newPage.id,
                        title: newPage.title,
                        nodes: []
                    });
                }, function (response) {
                    $scope.responseError = "Error creating new page: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                }
            );
        };

        var getRootNodesScope = function() {
            return angular.element(document.getElementById("tree-root")).scope();
        };

        $scope.collapseAll = function() {
            var scope = getRootNodesScope();
            scope.collapseAll();
        };

        $scope.expandAll = function() {
            var scope = getRootNodesScope();
            scope.expandAll();
        };
    }])
    .controller('SiteAddController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
        $scope.site = {};

        $scope.createNew = function (site) {
            Restangular.all('sites').post(site).then(function(newSite){
                console.log("Success: site created");
                $state.go('sites.detail', { siteId: newSite.id}, {reload: true});
            }, function (response) {
                $scope.responseError = "Error creating site: " + response.statusText;
                $scope.responseErrorShow = true;
                console.log("Error with status code: ", response.status);
            });
        };
    }])
    .controller('SiteDetailController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
        $scope.site = {};
        $scope.master = {};
        $scope.selectedSiteIndex = $stateParams.siteId;
        $scope.newPropName = "";
        $scope.newPropContent = "";

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
                    console.log("Success");
                    $state.go('^', $stateParams, {reload: true});
                }, function (response) {
                    $scope.responseError = "Error: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                });
        };

        $scope.addProp = function () {
            var siteProperty = {
                name: $scope.newPropName,
                content: $scope.newPropContent
            };
            Restangular.one('sites', $stateParams.siteId).customPOST(siteProperty).then(function (updatedSite) {
                    console.log("Success - property created");
                    $scope.site.properties = updatedSite.properties;
                    $scope.site.propertyMap= updatedSite.propertyMap;
                    $scope.newPropName = "";
                    $scope.newPropContent = "";
                }, function (response) {
                    $scope.responseError = "Error creating property: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                }
            );
        };

        $scope.saveProp = function (prop) {
            Restangular.one('sites', $stateParams.siteId).all(prop.id).customPUT(prop).then(function () {
                    console.log("Success - property saved");
                }, function (response) {
                    $scope.responseError = "Error saving property: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                }
            );
        };

        $scope.deleteProp = function (prop) {
            Restangular.one('sites', $stateParams.siteId).all(prop.name).remove().then(function () {
                    var idx = $scope.site.properties.indexOf(prop);
                    $scope.site.properties.splice(idx, 1);
                    console.log("Success - property removed");
                }, function (response) {
                    $scope.responseError = "Error removing property: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                }
            );
        };
    }])
    .controller('SiteListController', ['$scope', 'Restangular', function ($scope, Restangular) {
        Restangular.all('sites').getList().then(function (list) {
            $scope.sites = list;
        });
    }])
    .controller('PageEditController', ['$scope', '$state', '$stateParams', 'Restangular', '$upload',
        function ($scope, $state, $stateParams, Restangular, $upload) {
            $scope.page = {};
            $scope.images = [];
            $scope.docfiles = [];
            $scope.master = {};
            $scope.newPropName = "";
            $scope.newPropContent = "";

            $scope.editorOptions = {
                language: 'en'
            };

            Restangular.one('pages', $stateParams.pageId).get().then(function (data) {
                $scope.page = data;
                $scope.master = angular.copy(data);
            });

            $scope.$watch('page.title', function () {
                if ($scope.page.autoName) {
                    var txt = $scope.page.title + "";
                    var newName = txt.replace(/\W/g, '').toLowerCase();
                    $scope.page.name=newName;
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

            $scope.loadImages();

            $scope.removeImage = function(img) {
                Restangular.one('pages', $stateParams.pageId).one('images', img.id).remove().then(function () {
                    $scope.loadImages();
                });
            };

            $scope.imageUrl = function(img) {
                var l = "/att" + img.directoryPath + "/" + img.name;
                return l;
            };

            $scope.imgSetMain = function(img) {
                Restangular.one('pages', $stateParams.pageId).one('images', img.id).all("setmain").customPOST().then(function () {
                    $scope.loadImages();
                });
            };

            $scope.imgMoveUp = function(img) {
                Restangular.one('pages', $stateParams.pageId).one('images', img.id).all("moveup").customPOST().then(function () {
                    $scope.loadImages();
                });
            };

            $scope.imgMoveDown = function(img) {
                Restangular.one('pages', $stateParams.pageId).one('images', img.id).all("movedown").customPOST().then(function () {
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
                for (var i = 0; i < $files.length; i++) {
                    var file = $files[i];
                    $scope.upload = $upload.upload({
                        url: '/api/pages/' + $stateParams.pageId + '/images',
                        method: 'POST',
                        // method: 'POST' or 'PUT',
                        // headers: {'header-key': 'header-value'},
                        // withCredentials: true,
                        data: {myObj: $scope.page},
                        file: file
                        // or list of files: $files for html5 only
                        /* set the file formData name ('Content-Desposition'). Default is 'file' */
                        //fileFormDataName: myFile, //or a list of names for multiple files (html5).
                        /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
                        //formDataAppender: function(formData, key, val){}
                    }).progress(function (evt) {
                        $scope.progress[i] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                    }).success(function (data, status, headers, config) {
                        // file is uploaded successfully
                        $scope.uploadResult.push(data);
                        $scope.loadImages();
                    })
                    //.error(...)
                    //.then(success, error, progress);
                    .xhr(function(xhr){xhr.upload.addEventListener('abort', function() {console.log('abort complete')}, false)});
                }
                /* alternative way of uploading, send the file binary with the file's content-type.
                 Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
                 It could also be used to monitor the progress of a normal http post/put request with large data*/
                // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
            };

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
                for (var i = 0; i < $files.length; i++) {
                    var file = $files[i];
                    $scope.upload = $upload.upload({
                        url: '/api/pages/' + $stateParams.pageId + '/files',
                        method: 'POST',
                        // method: 'POST' or 'PUT',
                        // headers: {'header-key': 'header-value'},
                        // withCredentials: true,
                        data: {myObj: $scope.page},
                        file: file
                        // or list of files: $files for html5 only
                        /* set the file formData name ('Content-Desposition'). Default is 'file' */
                        //fileFormDataName: myFile, //or a list of names for multiple files (html5).
                        /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
                        //formDataAppender: function(formData, key, val){}
                    }).progress(function (evt) {
                        $scope.progress[i] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
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
                        				console.log('abort complete');
                        			}, false)});
                }
                /* alternative way of uploading, send the file binary with the file's content-type.
                 Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
                 It could also be used to monitor the progress of a normal http post/put request with large data*/
                // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
            };

            $scope.fileMoveUp = function(img) {
                Restangular.one('pages', $stateParams.pageId).one('files', img.id).all("moveup").customPOST().then(function () {
                    $scope.loadFiles();
                });
            };

            $scope.fileMoveDown = function(img) {
                Restangular.one('pages', $stateParams.pageId).one('files', img.id).all("movedown").customPOST().then(function () {
                    $scope.loadFiles();
                });
            };

            $scope.loadFiles = function() {
                Restangular.one('pages', $stateParams.pageId).all('files').getList().then(function (list) {
                    $scope.docfiles = list;
                });
            };

            $scope.loadFiles();

            $scope.removeFile = function(df) {
                Restangular.one('pages', $stateParams.pageId).one('files', df.id).remove().then(function () {
                    $scope.loadFiles();
                });
            };

            $scope.fileUrl = function(df) {
                var l = "/att" + df.directoryPath + "/" + df.name;
                return l;
            };

            $scope.addProp = function (localScope) {
                var pageProperty = {
                    name: localScope.newPropName,
                    content: localScope.newPropContent
                };
                Restangular.one('pages', $stateParams.pageId).all('properties').customPOST(pageProperty).then(function (updatedPage) {
                        console.log("Success - property created");
                        $scope.page.properties = updatedPage.properties;
                        $scope.page.propertyMap= updatedPage.propertyMap;
                        localScope.newPropName = "";
                        localScope.newPropContent = "";
                        $scope.master.properties = angular.copy(page.properties);
                    }, function (response) {
                        $scope.responseError = "Error creating property: " + response.statusText;
                        $scope.responseErrorShow = true;
                        console.log("Error with status code: ", response.status);
                    }
                );
            };

            $scope.saveProp = function (prop) {
                Restangular.one('pages', $stateParams.pageId).one('properties', prop.id).customPUT(prop).then(function () {
                      console.log("Success - property saved");
                      $scope.master.properties = angular.copy(page.properties);
                    }, function (response) {
                        $scope.responseError = "Error saving property: " + response.statusText;
                        $scope.responseErrorShow = true;
                        console.log("Error with status code: ", response.status);
                    }
                );
            };

            $scope.deleteProp = function (prop) {
                Restangular.one('pages', $stateParams.pageId).one('properties', prop.id).remove().then(function () {
                        var idx = $scope.page.properties.indexOf(prop);
                        $scope.page.properties.splice(idx, 1);
                        $scope.master.properties = angular.copy(page.properties);
                        console.log("Success - property removed");
                    }, function (response) {
                        $scope.responseError = "Error removing property: " + response.statusText;
                        $scope.responseErrorShow = true;
                        console.log("Error with status code: ", response.status);
                    }
                );
            };

            $scope.reset();
        }])
    .controller('UserListController', ['$scope', 'Restangular', function ($scope, Restangular) {
        Restangular.all('users').getList().then(function (list) {
            $scope.users = list;
        });
    }])
    .controller('UserDetailController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
        $scope.user = {};
        $scope.master = {};

        Restangular.one('users', $stateParams.userId).get().then(function (user) {
            $scope.user = user;
            $scope.master = angular.copy(user);
        });

        $scope.updateRoles = function () {
            if ($scope.user.roleMap) {
                var roles = [];
                var role;
                for (role in $scope.user.roleMap) {
                    if ($scope.user.roleMap[role]) roles.push(role);
                }
                $scope.user.roles = roles;
            }
        };

        $scope.$watch('user.roleMap.editor', function () {
            $scope.updateRoles();
        });
        $scope.$watch('user.roleMap.admin', function () {
            $scope.updateRoles();
        });
        $scope.$watch('user.roleMap.user', function () {
            $scope.updateRoles();
        });

        $scope.update = function (user) {
            $scope.master = angular.copy(user);
            user.save();

        };

        $scope.deleteUser = function (user) {
            user.remove()
                .then(function () {
                    console.log("Success");
                    $state.go('^', $stateParams, {reload: true});
                }, function (response) {
                    $scope.responseError = "Error: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                });
        };

        $scope.reset = function () {
            $scope.user = angular.copy($scope.master);
        };

        $scope.isUnchanged = function (user) {
            return angular.equals(user, $scope.master);
        };

        $scope.reset();

    }])
    .controller('UserAddNewController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
        $scope.user = {
            roleMap: {
                admin: false,
                editor: false,
                user: true
            },
            roles: ["user"]
        };
        $scope.master = {};

        $scope.responseError = "";
        $scope.responseErrorShow = false;

        $scope.updateRoles = function () {
            if ($scope.user.roleMap) {
                var roles = [];
                var role = "";
                for (role in $scope.user.roleMap) {
                    if ($scope.user.roleMap[role]) roles.push(role);
                }
                $scope.user.roles = roles;
            }
        };

        $scope.$watch('user.roleMap.editor', function () {
            $scope.updateRoles();
        });
        $scope.$watch('user.roleMap.admin', function () {
            $scope.updateRoles();
        });
        $scope.$watch('user.roleMap.user', function () {
            $scope.updateRoles();
        });

        $scope.update = function (user) {
            $scope.master = angular.copy(user);
            Restangular.all("users").post({
                name: user.name,
                email: user.email,
                password: user.password,
                roles: user.roles
            })
                .then(function () {
                    console.log("Success");
                    $state.go('^', $stateParams, {reload: true});
                }, function (response) {
                    $scope.responseError = "Error: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                });
        };

        $scope.reset = function () {
            $scope.user = angular.copy($scope.master);
        };

        $scope.isUnchanged = function (user) {
            return angular.equals(user, $scope.master);
        };

        $scope.reset();

    }])
    .controller('UserCredController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
        Restangular.one('users', $stateParams.userId).getList('credentials').then(function (creds) {
            $scope.credentials = creds;
        });

        $scope.removeCredential = function (credential) {

        };
    }])
    .controller('UserCredPasswordController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
        console.log("stateParams: " + $stateParams);
        Restangular.one('users', $stateParams.userId).one('credentials', $stateParams.credId).customGET("chpassword").then(function (formdata) {
            $scope.passwordData = formdata;
            $scope.master = angular.copy($scope.passwordData);
        });

        $scope.responseError = "";
        $scope.responseErrorShow = false;

        $scope.master = {};

        $scope.update = function (passwordData) {
            $scope.master = angular.copy(passwordData);
            Restangular
                .one('users', $stateParams.userId)
                .one('credentials', $stateParams.credId)
                .all("chpassword")
                .customPUT($scope.passwordData).then(function () {
                    console.log("Success");
                    $state.go('^');
                }, function (response) {
                    $scope.responseError = "Error: " + response.statusText;
                    $scope.responseErrorShow = true;
                    console.log("Error with status code: ", response.status);
                });

            //$scope.passwordData.customPUT("chpassword");
        };

        $scope.reset = function () {
            $scope.passwordData = angular.copy($scope.master);
        };

        $scope.isUnchanged = function (passwordData) {
            return angular.equals(passwordData, $scope.master);
        };

        $scope.reset();
    }])
    .controller('UserAuthTokenController', ['$scope', '$stateParams', 'Restangular', function ($scope, $stateParams, Restangular) {
        Restangular.one('users', $stateParams.userId).getList('authtokens').then(function (tokens) {
            $scope.authtokens = tokens;
        });

        $scope.getToken = function (token) {
            console.log("Token: " + token.uuid);
            Restangular.one("users", $stateParams.userId).one("authtokens", uuid).get().then(function (t) {
                $scope.authtoken = t;
            })
        };

        $scope.removeToken = function (token) {
            console.log("Remove token: " + token.uuid);
            var uuid = token.uuid;
            Restangular.one("users", $stateParams.userId).one("authtokens", uuid).remove();
            var idx = $scope.authtokens.indexOf(token);
            $scope.authtokens.splice(idx, 1);
        };
    }])
    .controller('SitemapController', ['$scope', '$state', '$stateParams', 'Restangular', function ($scope, $state, $stateParams, Restangular) {
        Restangular.all('sitemaps').all($stateParams.actionName).doPOST([{}]);
    }])
    .controller('SideNavController', ['$scope', function ($scope) {

    }]);

