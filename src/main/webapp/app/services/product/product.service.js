(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .factory('Product', Product)    //To get the information about a specific value
    .factory('ProductsByInstrumentType', ProductsByInstrumentType); //To get all the products of a specific instrument type

  Product.$inject = ['$resource'];

  function Product ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/products/:id',
      {id: "@_id"});
  }

  function ProductsByInstrumentType ($resource) {
    return $resource('http://127.0.0.1:8080/esmeurexreferential/api/products/byInstrumentType/:instrumentType',
      {instrumentType: "@instrumentType"});
  }
})();
