'use strict';

/**
 * @ngdoc directive
 * @name cliqpApp.directive:qpassa
 * @description
 * # qpassa
 */
angular.module('cliqpApp')
  .directive('qpassa', function () {
    return {
      template: '<div></div>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        element.text('this is the qpassa directive');
      }
    };
  });
