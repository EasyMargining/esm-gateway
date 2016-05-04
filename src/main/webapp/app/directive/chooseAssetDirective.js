(function () {
  'use strict';

  angular
    .module('easyMarginingApp')
    .directive('chooseAssetTable', chooseAssetTable);

  chooseAssetTable.$inject = [];

  function chooseAssetTable () {

    var constructTable = function(products, type) {

      var table;
      if (type > 0) {
        table = '<div class="col-md-6 no-padding">';
      } else {
        table = '<div class="col-md-12 no-padding">';
      }
      table += '<table class="marketTable">';
      table += '<thead>';
      if (type > 0) {
        table += '<tr>';
        if (type > 1) {
          table += '<th colspan="4">PUT</th>';
        } else {
          table += '<th colspan="4">CALL</th>';
        }
        table += '</tr>';
      }
      table += '<tr>';
      table += '<th>Maturity</th>';
      if (type > 0) {
        table += '<th>Strike</th>';
      }
      table += '<th>Last</th>';
      table += '<th></th>';

      table += '</thead>';
      table += '<tbody>';

      angular.forEach(products, function(maturityProduct, index) {
        table += '<tr>';
        table += '<td>' + index + '</td>';
        table += '<td></td>';
        table += '<td></td>';
        table += '<td></td>';
        table += '</tr>';
        angular.forEach(maturityProduct, function(price) {
          table += '<tr>';
          table += '<td></td>';
          table += '<td>' + price.exercisePrice + '</td>';
          table += '<td>' + price.settlementPrice + '</td>';

          table += '<td>';
          table += '<div class="optionChoice btn-group">';
          table += '<button type="button" class="btn btn-default typeOptionButton" ng-class="{typeOptionButtonSelected: isPositionSelected(price, true)}" ng-click="setCurrentPosition(price._id, true)">Short</button>';
          table += '<button type="button" class="btn btn-default typeOptionButton" ng-class="{typeOptionButtonSelected: isPositionSelected(price, false)}" ng-click="setCurrentPosition(price._id, false)">Long</button>';
          table += '</div>';
          table += '<div ng-show="isPositionSelected(price, false) || isPositionSelected(price, true)">';
          table += '<div class="animated fadeInDown">';
          table += '<input class="quantityInput" type="text" maxlength="6" size="6" placeholder="quantity" />';
          table += '<button  ng-click="addPosition(currentPosition)" class="btn transparentButton glyphicon glyphicon-plus-sign myGreen"></button>';
          table += '</div>';
          table += '</div>';
          table += '</td>';
          table += '</tr>';
        });
      });

      table += '</tbody>';
      table += '</table>';
      table += '</div>';
      return table;
    }

    return {
      restrict: 'E',
      link: function (scope, element) {
        scope.$watch('product', function(product) {
          if (product) {
            var html = '<div class="topHeader">';

            if (product.futuresPrices) {
              html += '<label>FUTURE ';
            } else {
              html += '<label>OPTION ';
            }
            html += product.productId + '</label>';
            html += '<label class="spaceBetweenLabel"></label>';
            html += ' <label>CENTER</label>&nbsp;<input class="numberInput center" type="number" ng-model="center" ng-change="adaptValues()"/>';
            if (!product.futuresPrices) {
              html += '<label>NUMBER OF STRIKES FROM CENTER &nbsp;';
              html += '<input class="numberInput center" type="number" ng-focus="selected=0"' +
                'ng-class="{notSelectedInput: selected!=0}" ng-model="strikesNumber" ng-change="adaptValues()"/>';
              html += 'OR &nbsp;';
              html += '<input class="percentInput center" type="number" ng-focus="selected=1"' +
                'ng-class="{notSelectedInput: selected!=1}" ng-model="strikesPercent" ng-change="adaptValues()"/>';
              html += '% </label>';
            }
            html += '<label class="spaceBetweenLabel"></label>';
            html += ' <button class="transparentButton glyphicon glyphicon-question-sign"></button>';
            html += '</div>';

            if (!product.futuresPrices) {
              html += constructTable(product.callPrices, 1);
              html += constructTable(product.putPrices, 2);
            } else {
              html += constructTable(product.futuresPrices, 0);
            }
            element.replaceWith(html)
          }
        });
      }
    }
  }
})();
