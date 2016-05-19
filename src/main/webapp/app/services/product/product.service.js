(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('Product', Product)    //To get the information about a specific value
    .factory('ProductsByInstrumentType', ProductsByInstrumentType); //To get all the products of a specific instrument type

  Product.$inject = ['$resource'];

  function Product ($resource) {
    return $resource('/esmeurexreferential/api/products/:id',
      {id: "@_id"});
  }

  function ProductsByInstrumentType ($resource) {
    return $resource('/esmeurexreferential/api/products/byInstrumentType/:instrumentType',
      {instrumentType: "@instrumentType"});
  }
})();
