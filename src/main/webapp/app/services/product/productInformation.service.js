(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('ProductInformation', ProductInformation)

  ProductInformation.$inject = ['$resource'];

  function ProductInformation ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/products/productInformation/:productId',
      {productId: "@productId"});
  }
})();
