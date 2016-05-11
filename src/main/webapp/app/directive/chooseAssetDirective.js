(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .directive('chooseAssetTable', chooseAssetTable);

  chooseAssetTable.$inject = [];

  function chooseAssetTable () {

    return {
      restrict: 'EA',
      scope : {
        product: '=',
        setCurrentPosition: '&',
        isPositionSelected: '&',
        addPosition: '&',
        updateAssetMaturity: '&',
        getAllMaturities: '&'
      },
      templateUrl : 'app/simulation/productTable.html'
    };
  }
})();
