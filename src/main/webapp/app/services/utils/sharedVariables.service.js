(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .service('SharedVariables', SharedVariables);

  SharedVariables.$inject = ['$rootScope'];

  function SharedVariables ($rootScope) {

    var portfolio = null;
    var positions = [];

    return {
      getPortfolio: function() {
        return portfolio;
      },

      setPortfolio: function(p) {
        portfolio = p;
      },

      getPositions: function() {
        return positions;
      },

      addPosition: function(pos) {
        positions.push(pos);
        $rootScope.$broadcast('addPosition',pos);
      }

    }
  }
})();