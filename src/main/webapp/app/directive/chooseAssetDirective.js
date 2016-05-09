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
        isPositionSelected: '&'
      },
      templateUrl : 'app/simulation/productTable.html'
    };
  }
})();
