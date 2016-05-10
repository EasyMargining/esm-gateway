(function() {
  'use strict';

  angular
    .module('easyMarginingApp')
    .controller('SimulationController', SimulationController)
    .controller('AddPositionController', AddPositionController)
    .controller('ParametersController', ParametersController)

  SimulationController.$inject = ['$scope', '$rootScope', 'Principal', 'LoginService', 'Portfolio', 'Account', 'User', 'PositionsByPortfolio', 'Position', 'Product', 'ngDialog', 'CurrencySign', 'SharedVariables'];
  AddPositionController.$inject = ['$scope', 'ProductsByInstrumentType', 'ProductInformation', 'usSpinnerService', 'SharedVariables', 'Position'];
  ParametersController.$inject = ['$scope'];

  function SimulationController ($scope, $rootScope, Principal, LoginService, Portfolio, Account, User, PositionsByPortfolio, Position, Product, ngDialog, CurrencySign, SharedVariables) {

    var vm = this;
    vm.account = null;
    vm.isAuthenticated = null;
    vm.login = LoginService.open;
    $scope.$on('authenticationSuccess', function() {
      getAccount();
    });

    getAccount();

    function getAccount() {
      Principal.identity().then(function(account) {
        vm.account = account;
        vm.isAuthenticated = Principal.isAuthenticated;
      });
    }

    /* GET THE PORTFOLIO LIST OF THE CLIENT CURRENTLY CONNECTED */
    var account = Account.get({}, function() {
      var user = User.get({login: account.login}, function() {
        var portfolios = Portfolio.query({owner: user.id}, function() {
          $rootScope.portfolios = portfolios;
          console.log($rootScope.portfolios)
        });
      })
    });

    $rootScope.positions = [];

    /* LOAD POSITIONS IN THE PORTFOLIO SELECTED */
    $rootScope.loadPositions = function(portfolioName) {

      var portfolioResource = $rootScope.portfolios.filter(function( obj ) {
        return obj.name === portfolioName;
      });

      //To avoid useless call to the server
      if (!$rootScope.portfolio || $rootScope.portfolio !== portfolioResource[0]) {
        $rootScope.positions = [];
        $rootScope.portfolio = portfolioResource[0];
        SharedVariables.setPortfolio($rootScope.portfolio);
        $rootScope.resetIsAdd();

        var positions = PositionsByPortfolio.query({portfolioId: $rootScope.portfolio.id}, function () {
          positions.forEach(function(position) {
           savePosition(position)
          });
        });
      }
    };

    function savePosition(position) {
      var product = Product.get({id: position.productId}, function() {
        var pos = {
          position: position,
          product: product
        }
        $rootScope.positions.push(pos)
      });
    }

    $scope.$on('addPosition', function(event, data) {
      console.log(data)
      savePosition(data);
    });

    /* UPDATE A POSITION */
    $scope.updatePosition = function(id, quantity) {
      console.log("id = " + id)
      console.log("new quantity = " + quantity)
      var updatedPosition = Position.get({ id: id}, function() {
        updatedPosition.quantity = quantity;
        updatedPosition.$update(function() {
          //updated in the backend
        });
      });
    }

    /* DELETE DIALOG */
    $scope.openDeleteDialog = function (position) {
      $scope.position = position
      ngDialog.open({
        template: 'app/simulation/confirmationModal.html',
        className: 'ngdialog-theme-default',
        scope: $scope
      });
    };

    /* DESCRIPTION PRODUCT DIALOG */
    $scope.openDescriptionProductDialog = function (product) {
      $scope.product = product;
      $scope.moneySign = CurrencySign.getCurrencySign(product.currency);
      ngDialog.open({
        template: 'app/simulation/descriptionProductModal.html',
        className: 'ngdialog-theme-default',
        scope: $scope
      });
    };


    $scope.cancel = function() {
      ngDialog.close();
    }

    $scope.delete = function(positionId) {
      var deletedPosition = Position.get({ id: positionId}, function() {
        console.log(deletedPosition)
        deletedPosition.$delete(function() {
          console.log(deletedPosition.productId + " deleted")
          //To delete from the rootScope
          $rootScope.positions = $rootScope.positions.filter(function(pos) {
            return pos.id !== positionId;
          });
          ngDialog.close();
        });
      });
    }


    $rootScope.resetIsAdd = function() {
      $rootScope.isAdd = 0;
    }
  };

  function AddPositionController($scope, ProductsByInstrumentType, ProductInformation, usSpinnerService, SharedVariables, Position) {

    $scope.typeAsset = null;

    $scope.currentPosition = null;

    $scope.setCurrentPosition = function(_id, isShort) {
      $scope.currentPosition = {
        isShort: isShort,
        id: _id
      };
    }

    $scope.isPositionSelected = function(_id, isShort) {
      return $scope.currentPosition && $scope.currentPosition.isShort === isShort
        && $scope.currentPosition.id === _id;
    }

    $scope.numberNewPosition = 0;
    $scope.newPositions = [];

    $scope.addPosition = function(quantity) {
      //!isNaN(parseFloat(quantity)) --> Return true is quantity is a number
      if (quantity && !isNaN(parseFloat(quantity)) && quantity > 0) {
        $scope.newPositions.push({id : $scope.currentPosition.id,
        quantity: ($scope.currentPosition.isShort ? -quantity : quantity)});
        $scope.numberNewPosition++;
      }
    }

    $scope.saveNewPositions = function() {
      var newPos = [];
      for (var i in $scope.newPositions) {
        var position = $scope.newPositions[i];
        var pos = new Position();
        pos.portfolioId = SharedVariables.getPortfolio().id;
        pos.productId = position.id;
        pos.quantity = position.quantity;
        pos.exchange = "eurex";
        pos.state = "live";
        pos.effectiveDate = "2016-05-10";
        newPos.push(pos);
      }
      recursiveSave(newPos);
    }

    function recursiveSave(pos) {
      if (pos.length > 0) {
        var p = pos.pop();
        Position.save(p, function () {
          SharedVariables.addPosition(p);
          recursiveSave(pos);
        });
      }
    }

    $scope.$watch(
      function() { return $scope.typeAsset},
      function (newValue) {
        var instrumentType = (newValue === 1) ? 'Option' : (newValue === 2) ? 'Future' : '';
        var productNameOrProductIdList = ProductsByInstrumentType.query({instrumentType: instrumentType}, function() {
          $scope.productNameOrProductIdList = productNameOrProductIdList;
        });
      }
    );

    $scope.showTable = false;

    /*********** HANDLER LOADING SPINNER ******************/
    $scope.startSpin = function() {
      if (!$scope.spinneractive) {
        usSpinnerService.spin('spinner-1');
      }
    };

    $scope.stopSpin = function() {
      if ($scope.spinneractive) {
        usSpinnerService.stop('spinner-1');
      }
    };
    $scope.spinneractive = false;

    $scope.$on('us-spinner:spin', function(event, key) {
      $scope.spinneractive = true;
    });

    $scope.$on('us-spinner:stop', function(event, key) {
      $scope.spinneractive = false;
    });

    $scope.getProductInformations = function(codeProduct) {
      if ($scope.productNameOrProductIdList.indexOf(codeProduct) !== -1) {
        $scope.startSpin();

        var product = ProductInformation.get({productId: codeProduct}, function() {
          $scope.allProduct = product;
          $scope.displayedProduct = {};
          angular.copy(product, $scope.displayedProduct);
          console.log($scope.allProduct)
          $scope.stopSpin();
          $scope.showTable = true;
        });
      } else {
        $scope.showTable = false;
      }
    }

    $scope.updateCallMaturity = function(callMaturity) {
      if (callMaturity) {
        $scope.displayedProduct.callPrices = {};
        $scope.displayedProduct.callPrices[callMaturity] = $scope.allProduct.callPrices[callMaturity];
      } else {
        angular.copy($scope.allProduct.callPrices, $scope.displayedProduct.callPrices);
      }
    }

    $scope.updatePutMaturity = function(putMaturity) {
      if (putMaturity) {
        $scope.displayedProduct.putPrices = {};
        $scope.displayedProduct.putPrices[putMaturity] = $scope.allProduct.putPrices[putMaturity];
      } else {
        angular.copy($scope.allProduct.putPrices, $scope.displayedProduct.putPrices);
      }
    }

    $scope.updateFuturesMaturity = function(futuresMaturity) {
      if (futuresMaturity) {
        $scope.displayedProduct.futuresPrices = {};
        $scope.displayedProduct.futuresPrices[futuresMaturity] = $scope.allProduct.futuresPrices[futuresMaturity];
      } else {
        angular.copy($scope.allProduct.futuresPrices, $scope.displayedProduct.futuresPrices);
      }
    }

    $scope.selected = 0;
    $scope.center = 97;
    $scope.strikesNumber = 10;
    $scope.strikesPercent = 5.7;

    $scope.adaptValues = function() {
      if ($scope.selected === 0) {
        $scope.strikesPercent = Math.round(($scope.strikesNumber / $scope.center) * 10000) / 100;
      } else {
        $scope.strikesNumber = Math.round($scope.center * $scope.strikesPercent) / 100;
      }
    };
  }

  function ParametersController ($scope) {

    $scope.portfolioName = "";

    $scope.isValidPortfolioName = function() {
      return ($scope.portfolioName.length >= 5);
    }

    $scope.isValidDate = function() {
      return ($scope.dt instanceof Date);
    }

    $scope.today = function() {
      $scope.dt = new Date();
    };

    $scope.clear = function() {
      $scope.dt = null;
    };

    $scope.open = function() {
      $scope.popup.opened = true;
    };

    $scope.popup = {
      opened: false
    };
  }
})();
