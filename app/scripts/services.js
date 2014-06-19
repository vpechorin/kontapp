'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var kontAppServices = angular.module('kontApp.services', ['ngResource']);

kontAppServices.factory('SiteService', ['$resource', function($resource) {
    return $resource('/api/sites/:siteId', { }, {
        query: { method: "GET", isArray: true },
        update: {method:'PUT', params: {siteId: '@siteId'}}
    });
}]);

kontAppServices.factory('UserService', ['$resource', function($resource) {
    return $resource('/api/user/:action', { }, {
        authenticate: {
            method: "POST",
            params: {'action': 'authenticate'},
            headers : {'Content-Type': 'application/x-www-form-urlencoded'}
        }
    });
}]);

kontAppServices.factory('UserOpsService', ['$resource', function($resource) {
    return $resource('/api/users/:userId', { }, {
        query: { method: "GET", isArray: true },
        update: {method:'PUT', params: {userId: '@userId'}},
        deleteToken: {method:'DELETE', params: {userId: '@userId', tokenId: '@'}}
    });
}]);

kontAppServices.factory('PageService', ['$resource', function($resource) {
    return $resource('/api/pages/:pageId', { }, {
        query: { method: "GET", isArray: true }
    });
}]);

kontAppServices.provider('requestNotification', function () {
        // This is where we keep subscribed listeners
        var onRequestStartedListeners = [];
        var onRequestEndedListeners = [];
        // This is a utility to easily increment the request count
        var count = 0;
        var requestCounter = {
            increment: function () {
                count++;
            },
            decrement: function () {
                if (count > 0)
                    count--;
            },
            getCount: function () {
                return count;
            }
        };

        // Subscribe to be notified when request starts
        this.subscribeOnRequestStarted = function (listener) {
            onRequestStartedListeners.push(listener);
        };

        // Tell the provider, that the request has started.
        this.fireRequestStarted = function (request) {
            // Increment the request count
            requestCounter.increment();
            //run each subscribed listener
            angular.forEach(onRequestStartedListeners, function (listener) {
                // call the listener with request argument
                listener(request);
            });
            return request;
        };

        // this is a complete analogy to the Request START
        this.subscribeOnRequestEnded = function (listener) {
            onRequestEndedListeners.push(listener);
        };

        this.fireRequestEnded = function () {
            requestCounter.decrement();
            var passedArgs = arguments;
            angular.forEach(onRequestEndedListeners, function (listener) {
                listener.apply(this, passedArgs);
            });
            return arguments[0];
        };

        this.getRequestCount = requestCounter.getCount;

        //This will be returned as a service
        this.$get = function () {
            var that = this;
            // just pass all the functions
            return {
                subscribeOnRequestStarted: that.subscribeOnRequestStarted,
                subscribeOnRequestEnded: that.subscribeOnRequestEnded,
                fireRequestEnded: that.fireRequestEnded,
                fireRequestStarted: that.fireRequestStarted,
                getRequestCount: that.getRequestCount
            };
        };
    }
);



