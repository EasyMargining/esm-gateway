(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('ProductInformation', ProductInformation)

  ProductInformation.$inject = ['$resource'];

  function ProductInformation ($resource) {
    return $resource('/esmeurexreferential/api/products/product-information/:productId/effective-date/:effectiveDate',
      {productId: "@productId", effectiveDate: "@effectiveDate"});
  }
})();
