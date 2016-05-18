(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('ProductInformation', ProductInformation)

  ProductInformation.$inject = ['$resource'];

  function ProductInformation ($resource) {
    return $resource('/esmeurexreferential/api/products/productInformation/:productId',
      {productId: "@productId"});
  }
})();
