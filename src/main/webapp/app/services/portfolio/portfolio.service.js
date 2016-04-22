(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('Portfolio', Portfolio);

  Portfolio.$inject = ['$resource'];

  function Portfolio ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/portfolios', {});
  }
})();
