(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .service('SharedVariables', SharedVariables);

  SharedVariables.$inject = ['$rootScope'];

  function SharedVariables ($rootScope) {

    var portfolio = null;
    var positions = [];
    var valuationDate = null;
    var positionDate = null;

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
      },

      getValuationDate: function() {
        return valuationDate;
      },

      setValuationDate: function(date) {
        valuationDate = date;
      },

      getPositionDate: function() {
        return positionDate;
      },

      setPositionDate: function(date) {
        positionDate = date;
      }

    }
  }
})();
