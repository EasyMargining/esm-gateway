(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('PositionsByPortfolio', PositionsByPortfolio)   //To get positions of a portfolio
    .factory('Position', Position);    //To get (and update) a particular position

  PositionsByPortfolio.$inject = ['$resource'];
  Position.$inject = ['$resource'];

  function PositionsByPortfolio ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/positions/byPortfolio/:portfolioId',
      {portfolioId: "@portfolioId"});
  }

  Position.$inject = ['$resource'];

  function Position ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/positions/:id',
      {id: "@_id"},
      {
        update: { method: 'PUT'},
        delete: { method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          params: {id: '@id'} }
      });
  }
})();
