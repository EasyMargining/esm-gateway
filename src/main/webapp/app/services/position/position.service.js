(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('PositionsByPortfolio', PositionsByPortfolio)   //To get positions of a portfolio
    .factory('Position', Position);    //To get (and update) a particular position

  PositionsByPortfolio.$inject = ['$resource'];
  Position.$inject = ['$resource'];

  function PositionsByPortfolio ($resource) {
    return $resource('/esmeurexreferential/api/positions/portfolio/:portfolioId/valuation-date/:valuationDate',
      {portfolioId: "@portfolioId", valuationDate: "@effectiveDate"});
  }

  Position.$inject = ['$resource'];

  function Position ($resource) {
    return $resource('/esmeurexreferential/api/positions/:id',
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
