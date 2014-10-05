'use strict';

var app = require('angular').module('kontApp');

app.directive('appVersion', function (version) {
  return function (scope, elm, attrs) {
    elm.text(version);
  };
});

app.directive('passwordValidate', function () {
  return {
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function (viewValue) {

        scope.pwdValidLength = (viewValue && viewValue.length >= 8 ? true : false);
        scope.pwdHasLetter = (viewValue && /[A-z]/.test(viewValue)) ? true : false;
        scope.pwdHasNumber = (viewValue && /\d/.test(viewValue)) ? true : false;

        if (scope.pwdValidLength && scope.pwdHasLetter && scope.pwdHasNumber) {
          ctrl.$setValidity('pwd', true);
          return viewValue;
        } else {
          ctrl.$setValidity('pwd', false);
          return undefined;
        }

      });
    }
  };
});

app.directive('ngConfirmClick', function() {
    return {
      priority: -1,
      restrict: 'A',
      link: function(scope, element, attrs){
        element.bind('click', function(e){
          var message = attrs.ngConfirmClick;
          if(message && !confirm(message)){
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        });
      }
    };
  }
);

app.directive('loadingWidget', function (requestNotification) {
  return {
    restrict: 'AC',
    link: function (scope, element) {
      // hide the element initially
      element.hide();

      //subscribe to listen when a request starts
      requestNotification.subscribeOnRequestStarted(function () {
        // show the spinner!
        element.show();
      });

      requestNotification.subscribeOnRequestEnded(function () {
        // hide the spinner if there are no more pending requests
        if (requestNotification.getRequestCount() === 0) { element.hide(); }
      });
    }
  };
});

app.directive('ensureUnique', function(Restangular, $stateParams, $timeout) {
  var checking = null;
  return {
    require: 'ngModel',
    link: function(scope, ele, attrs, c) {
      scope.$watch(attrs.ngModel, function(newVal) {
        if (!checking) {
          checking = $timeout(function() {
            Restangular
            .one('pages', $stateParams.pageId)
            .customGET('namecheck', {name: encodeURIComponent(c.$modelValue)})
            .then(
              function () {
                // console.log('name unique check OK');
                c.$setValidity('unique', true);
                checking = null;
              }, function (response) {
                // console.log('name unique check FAIL');
                c.$setValidity('unique', false);
                checking = null;
              });
          }, 500);
        }
      });
    }
  };
});

app.directive('nxEqualEx', function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, model) {
      if (!attrs.nxEqualEx) {
        // console.error('nxEqualEx expects a model as an argument!');
        return;
      }
      scope.$watch(attrs.nxEqualEx, function (value) {
        // Only compare values if the second ctrl has a value.
        if (model.$viewValue !== undefined && model.$viewValue !== '') {
          model.$setValidity('nxEqualEx', value === model.$viewValue);
        }
      });
      model.$parsers.push(function (value) {
        // Mute the nxEqual error if the second ctrl is empty.
        if (value === undefined || value === '') {
          model.$setValidity('nxEqualEx', true);
          return value;
        }
        var isValid = value === scope.$eval(attrs.nxEqualEx);
        model.$setValidity('nxEqualEx', isValid);
        return isValid ? value : undefined;
      });
    }
  };
});
