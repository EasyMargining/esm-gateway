(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .directive('descriptionProductDialog', descriptionProductDialog);

  descriptionProductDialog.$inject = [];

  function descriptionProductDialog () {

    var controller = ['$scope', 'ngDialog', 'CurrencySign', function($scope, ngDialog, CurrencySign) {

      $scope.openDescriptionProductDialog = function (product) {
        $scope.moneySign = CurrencySign.getCurrencySign(product.currency);
        ngDialog.open({
          template: 'app/simulation/descriptionProductModal.html',
          className: 'ngdialog-theme-default',
          scope: $scope
        });
      };

    }];

    var template = '<button type ="button" class="transparentButton glyphicon glyphicon-question-sign"' +
      'ng-click="openDescriptionProductDialog(product)" title="get information on the product"></button>';

    return {
      restrict: 'EA',
      scope : {
        product: '=',
      },
      controller: controller,
      template : template
    };
  }
})();
