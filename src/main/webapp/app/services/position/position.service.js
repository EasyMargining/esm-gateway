(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('Position', Position);

  Position.$inject = ['$resource'];

  function Position ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/positions/byPortfolio/:portfolioId',
      {portfolioId: "@portfolioId"});
  }
})();
