(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('CurrencySign', CurrencySign);

  CurrencySign.$inject = [];

  function CurrencySign () {
    return {
      getCurrencySign: function(str) {
        switch(str) {
          case "USD":
            return "$";
          case "EUR":
            return "€";
          case "GBP":
            return "£";
          default:
            return "unknown currency"
        }
      }
    }
  }
})();
