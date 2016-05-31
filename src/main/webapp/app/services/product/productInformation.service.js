(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('ProductInformation', ProductInformation)

  ProductInformation.$inject = ['$resource'];

  function ProductInformation ($resource) {
    return $resource('/esmeurexreferential/api/products/product-information/:productIdentifier/effective-date/:effectiveDate',
      {productIdentifier: "@productIdentifier", effectiveDate: "@effectiveDate"});
  }
})();
