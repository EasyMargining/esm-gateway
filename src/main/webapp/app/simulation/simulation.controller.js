(function() {
  'use strict';

  angular
    .module('easyMarginingApp')
    .controller('SimulationController', SimulationController)
    .controller('AddPositionController', AddPositionController)
    .controller('ParametersController', ParametersController)

  SimulationController.$inject = ['$scope', '$rootScope', 'Principal', 'LoginService', 'Portfolio', 'Account', 'User', 'PositionsByPortfolio', 'Position', 'Product', 'ngDialog', 'CurrencySign'];
  AddPositionController.$inject = ['$scope', 'ProductsByInstrumentType', 'usSpinnerService'];
  ParametersController.$inject = ['$scope'];

  function SimulationController ($scope, $rootScope, Principal, LoginService, Portfolio, Account, User, PositionsByPortfolio, Position, Product, ngDialog, CurrencySign) {

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
        $rootScope.portfolio = portfolioResource[0];
        $rootScope.resetIsAdd();

        var positions = PositionsByPortfolio.query({portfolioId: $rootScope.portfolio.id}, function () {
          positions.forEach(function(position) {
            var product = Product.get({id: position.productId}, function() {
              var pos = {
                position: position,
                product: product
              }
              $rootScope.positions.push(pos)
              console.log($rootScope.positions)
            });
          });
        });
      }
    };

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

  //TODO: Voir si ce code est utile

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
  };

  function AddPositionController($scope, ProductsByInstrumentType, usSpinnerService) {

    $scope.typeAsset = null;

    $scope.$watch(
      function() { return $scope.typeAsset},
      function (newValue) {
        var instrumentType = (newValue === 1) ? 'O' : (newValue === 2) ? 'F' : '';
        var productNameOrProductIdList = ProductsByInstrumentType.query({instrumentType: instrumentType}, function() {
          $scope.productNameOrProductIdList = productNameOrProductIdList;
          console.log($scope.productNameOrProductIdList)
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

        //TODO : Requete pour recup tous les stike du produit ciblé


        $scope.stopSpin();
        $scope.showTable = true;
      } else {
        $scope.showTable = false;
      }
    }

    $scope.numberNewPosition = 0;

    $scope.addPosition = function() {
      $scope.numberNewPosition++;
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
