(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('Positions', Positions)   //To get positions of a portfolio
    .factory('Position', Position);    //To get (and update) a particular position

  Positions.$inject = ['$resource'];

  function Positions ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/positions/byPortfolio/:portfolioId',
      {portfolioId: "@portfolioId"});
  }

  Position.$inject = ['$resource'];

  function Position ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/positions/:id',
      {id: "@_id"},
      {
        update: {
          method: 'PUT'
        }
      });
  }
})();
