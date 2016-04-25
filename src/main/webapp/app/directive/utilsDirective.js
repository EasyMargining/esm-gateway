(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .directive('focusMe', FocusMe);

  FocusMe.$inject = [];

  function FocusMe ($timeout) {
    return {
      scope: {trigger: '=focusMe'},
      link: function (scope, element) {
        scope.$watch('trigger', function (value) {
          if (value === true) {
            element[0].disabled = false;
            element[0].focus();
            scope.trigger = false;
          }
        });
      }
    }
  };
})();
