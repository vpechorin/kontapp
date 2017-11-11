'use strict';

require('jquery');

var angular = require('angular');
require('ngFileUpload');
require('angular-resource');
require('angular-cookies');
require('angular-ui-router');
require('restangular');
require('lodash');
require('angular-ui-tree');
require('angular-bootstrap');
require('ngSanitize');
require('textAngular');
require('angular-loading-bar');
require('json-formatter');

var app = angular.module('kontApp', ['ng', 'ui.router', 'ngResource', 'ngCookies',
  'ui.bootstrap', 'ui.tree',
  'restangular','textAngular',
  'ngFileUpload', 'angular-loading-bar', 'jsonFormatter']);

require('./filters');
require('./directives');
require('./controllers');

app.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, RestangularProvider) {

  $locationProvider.html5Mode(false);

  RestangularProvider.setBaseUrl('/api');

  $urlRouterProvider.otherwise('/sites');

  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: 'partials/login.html',
    controller: 'LoginController'
  })

  .state('dataforms', {
    url: '/dataforms',
    templateUrl: 'partials/dataforms.html',
    controller: 'DataFormListController'
  })
  .state('dataforms.detail', {
    url: '/{formId:[0-9]{0,9}}/edit',
    templateUrl: 'partials/dataformdetail.html',
    controller: 'DataFormDetailController'
  })
  .state('dataforms.create', {
    url: '/create',
    templateUrl: 'partials/dataformcreate.html',
    controller: 'DataFormCreateController'
  })
  .state('dataforms.records', {
    url: '/{formId:[0-9]{0,9}}/records/{pageId:[0-9]{0,9}}',
    templateUrl: 'partials/dataformrecords.html',
    controller: 'DataFormRecordsController'
  })

  .state('sites', {
    url: '/sites',
    templateUrl: 'partials/sitelist.html',
    controller: 'SiteListController'
  })
  .state('sites.detail', {
    url: '/{siteId:[0-9]{0,9}}',
    templateUrl: 'partials/sitedetail.html',
    controller: 'SiteDetailController'
  })
  .state('sites.create', {
    url: '/create',
    templateUrl: 'partials/siteadd.html',
    controller: 'SiteAddController'
  })
  .state('sites.pagetree', {
    url: '/{siteId:[0-9]{0,9}}/pagetree',
    templateUrl: 'partials/pagetree.html',
    controller: 'PageTreeController'
  })
  .state('sites.pages', {
    url: '/{siteId:[0-9]{0,9}}/pages/{pageId:[0-9]{0,9}}',
    templateUrl: 'partials/pagedetail.html',
    controller: 'PageEditController'
  })

  .state('users', {
    url: '/users',
    templateUrl: 'partials/userlist.html',
    controller: 'UserListController'
  })
  .state('users.add', {
    url: '/add',
    templateUrl: 'partials/useradd.html',
    controller: 'UserAddNewController'
  })
  .state('users.detail', {
    url: '/{userId:[0-9]{0,9}}',
    templateUrl: 'partials/userdetail.html',
    controller: 'UserDetailController'
  })
  .state('users.detail.credentials', {
    url: '/credentials',
    templateUrl: 'partials/usercredentials.html',
    controller: 'UserCredController'
  })
  .state('users.detail.credentials.chpassword', {
    url: '/chpassword/{credId}',
    templateUrl: 'partials/usercredchpassword.html',
    controller: 'UserCredPasswordController'
  })
  .state('users.detail.authtokens', {
    url: '/authtokens',
    templateUrl: 'partials/userauthtokens.html',
    controller: 'UserAuthTokenController'
  })

  .state('sitemap', {
    url: '/sitemap/{actionName}',
    template: 'OK',
    controller: 'SitemapController'
  })
  .state('prerender', {
    url: '/prerender/do',
    template: 'OK',
    controller: 'PrerenderController'
  });

  /* Register error provider that shows message on failed requests or redirects to login page on
            * unauthenticated requests */
  $httpProvider.interceptors.push(function ($q, $rootScope, $location) {
    return {
      'responseError': function (rejection) {
        var status = rejection.status;
        var config = rejection.config;
        var method = config.method;
        var url = config.url;

        if (status === 401) {
          $location.path('/login');
        } else {
          $rootScope.error = method + ' on ' + url + ' failed with status ' + status;
        }

        return $q.reject(rejection);
      }
    };
  }
                                 );

  /* Registers auth token interceptor, auth token is either passed by header or by query parameter
            * as soon as there is an authenticated user */
  $httpProvider.interceptors.push(function ($q, $rootScope) {
    return {
      'request': function (config) {

        var useAuthTokenHeader = true;

        var isRestCall = config.url.indexOf('/api') === 0;
        if (isRestCall && angular.isDefined($rootScope.authToken)) {
          var authToken = $rootScope.authToken;
          if (useAuthTokenHeader) {
            config.headers['X-Auth-Token'] = authToken;
          } else {
            config.url = config.url + '?token=' + authToken;
          }
        }
        return config || $q.when(config);
      }
    };
  }
                                 );

});

app.run(function ($rootScope, $location, $cookieStore, Restangular) {

  // console.log("Initialize rootScope");

  /* Reset error when a new view is loaded */
  $rootScope.$on('$viewContentLoaded', function () {
    delete $rootScope.error;
  });

  // console.log("Initialize hasRole function");

  $rootScope.hasRole = function (role) {

    if ($rootScope.user === undefined) {
      return false;
    }

    if ($rootScope.user.roles[role] === undefined) {
      return false;
    }

    return $rootScope.user.roles[role];
  };

  $rootScope.logout = function () {
    delete $rootScope.user;
    delete $rootScope.authToken;
    $cookieStore.remove('authToken');
    $location.path('/login');
  };

  /* Try getting valid user from cookie or go to login page */
  var originalPath = $location.path();
  $location.path('/login');
  var authToken = $cookieStore.get('authToken');
  if (authToken !== undefined) {
    $rootScope.authToken = authToken;
    Restangular.one('user').get().then(function (currentUser) {
      $rootScope.user = currentUser.plain();
      $location.path(originalPath);
    });
  }

  $rootScope.initialized = true;
});
