(function() {
  'use strict';

  angular
    .module('easyMarginingApp')
    .controller('SimulationController', SimulationController)
    .controller('AddPositionController', AddPositionController)
    .controller('ParametersController', ParametersController)

  SimulationController.$inject = ['$scope', '$rootScope', '$filter', 'Principal', 'LoginService', 'Portfolio', 'Account', 'User', 'PositionsByPortfolio', 'Position', 'Product', 'ngDialog', 'CurrencySign', 'SharedVariables'];
  AddPositionController.$inject = ['$scope', 'ProductsByInstrumentType', 'ProductInformation', 'usSpinnerService', 'SharedVariables', 'Position'];
  ParametersController.$inject = ['$scope', 'SharedVariables'];

  function SimulationController ($scope, $rootScope, $filter, Principal, LoginService, Portfolio, Account, User, PositionsByPortfolio, Position, Product, ngDialog, CurrencySign, SharedVariables) {

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

    /**
     * Load the positions in the portfolio currently selected
     * @param portfolioName : the portfolio currently selected
     */
    $rootScope.loadPositions = function(portfolioName) {

      var portfolioResource = $rootScope.portfolios.filter(function( obj ) {
        return obj.name === portfolioName;
      });

      $rootScope.positionsFormated = [];

      $rootScope.portfolio = portfolioResource[0];
      SharedVariables.setPortfolio($rootScope.portfolio);
      $rootScope.resetIsAdd();

      var valuationDateFormated = $filter('date')( SharedVariables.getValuationDate(), "yyyy-MM-dd");

      var positions = PositionsByPortfolio.query(
        {portfolioId: $rootScope.portfolio.id, valuationDate: valuationDateFormated},
        function () {
          positions.forEach(function(position) {
            pushPosition(position, false)
          });
        }
      );
    };

    function pushPosition(position, isAdd) {

      var samePos = $rootScope.positionsFormated.filter(function(pos) {
        return pos.product.id === position.productId;
      });

      if (!isAdd || SharedVariables.getPositionDate() <= SharedVariables.getValuationDate()) {
        if (samePos.length > 0) {
          samePos[0].aggregatedQuantity += position.quantity;
          samePos[0].descPositions.push({
            id: position.id,
            effectiveDate: position.effectiveDate,
            exchange: position.exchange,
            quantity: position.quantity
          });
        } else {
          var positionFormated = {
            aggregatedQuantity: position.quantity,
            portfolioId: position.portfolioId,
            product: {},
            descPositions: []
          }
          positionFormated.product.id = position.productId;
          positionFormated.descPositions.push({
            id: position.id,
            effectiveDate: position.effectiveDate,
            exchange: position.exchange,
            quantity: position.quantity
          });

          $rootScope.positionsFormated.push(positionFormated);

          var product = Product.get({id: position.productId}, function () {
            positionFormated.product = product;
          });
        }
      }
    }

    $scope.$on('addPosition', function(event, data) {
      console.log(data)
      pushPosition(data, true);
    });


    $scope.openClosePosition = function(position) {
      $scope.position = position;
      $scope.typeModal = 1;
      ngDialog.open({
        template: 'app/simulation/confirmationModal.html',
        className: 'ngdialog-theme-default',
        scope: $scope
      });
    };

    $scope.closePosition = function(productId) {
      //TODO : write this function
    }

    /* UPDATE A POSITION */
    $scope.updatePosition = function(id, quantity) {

      //TODO : change this function
      /*console.log("id = " + id)
      console.log("new quantity = " + quantity)
      var updatedPosition = Position.get({ id: id}, function() {
        updatedPosition.quantity = quantity;
        updatedPosition.$update(function() {
          //updated in the backend
        });
      });*/
    };

    /* DELETE DIALOG */
    $scope.openDeleteDialog = function (position) {
      $scope.position = position;
      $scope.typeModal = 2;
      ngDialog.open({
        template: 'app/simulation/confirmationModal.html',
        className: 'ngdialog-theme-default',
        scope: $scope
      });
    };

    $scope.deletePosition = function(productId) {

      var positionFormated = $rootScope.positionsFormated.filter(function(pos) {
        return pos.product.id === productId;
      });

      var positionsToDelete = [];
      for (var i in positionFormated[0].descPositions) {
        positionsToDelete.push(angular.copy(positionFormated[0].descPositions[i].id));
      }
      recursiveDelete(positionsToDelete);
      $rootScope.positionsFormated.splice($rootScope.positionsFormated.indexOf(positionFormated),1);
      ngDialog.close();
    }

    function recursiveDelete(pos) {
      if (pos.length > 0) {
        var p = pos.pop();
        Position.delete({id: p}, function () {
          recursiveDelete(pos);
        });
      }
    }

    $rootScope.resetIsAdd = function() {
      $rootScope.isAdd = 0;
    }
  };

  function AddPositionController($scope, ProductsByInstrumentType, ProductInformation, usSpinnerService, SharedVariables, Position) {

    $scope.instrumentType = null;   //1 for Option, 2 for futures
    $scope.currentPosition = null;  // last position opened by the user

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

    $scope.newPositions = [];

    /**
     * Add the position (product and quantity) in the array $scope.newPositions
     * @param quantity : the quantity enter by the user corresponding to the product in $scope.currentPosition
     */
    $scope.addPosition = function(quantity) {
      //!isNaN(parseFloat(quantity)) --> Return true is quantity is a number
      if (quantity && !isNaN(parseFloat(quantity)) && quantity > 0) {
        $scope.newPositions.push({id : $scope.currentPosition.id,
          quantity: ($scope.currentPosition.isShort ? -quantity : quantity)});
      }
    }

    /**
     * Create the array containing the new positions as entity in order to persist them in db.
     */
    $scope.saveNewPositions = function() {
      var newPos = [];
      for (var i in $scope.newPositions) {
        var position = $scope.newPositions[i];
        var pos = new Position();
        pos.portfolioId = SharedVariables.getPortfolio().id;
        pos.productId = position.id;
        pos.quantity = Number(position.quantity);
        pos.exchange = "eurex";
        pos.state = "live";
        pos.effectiveDate = SharedVariables.getPositionDate();
        newPos.push(pos);
      }
      recursiveSave(newPos);
    }

    /**
     * Send a request to persist the new positions in pos
     * @param pos : array of the new positions to persist
     */
    function recursiveSave(pos) {
      if (pos.length > 0) {
        var p = pos.pop();
        Position.save(p, function () {
          SharedVariables.addPosition(p);
          recursiveSave(pos);
        });
      }
    }

    /**
     * Watch and return the list of assets the page needs (Option or futures)
     */
    $scope.$watch(
      function() { return $scope.instrumentType},
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

    /*******************************************************/

    /**
     * Function only use in option case to initialize the center.
     * For the moment by default we init the center with the average of all the strikes
     *
     * @return center
     */
    function initCenter() {
      var sum = 0;
      var numberOfPrices = 0;
      for (var maturity in $scope.allProduct.callPrices) {
        $scope.allProduct.callPrices[maturity].forEach(function(obj) {
          sum = sum + obj.exercisePrice;
          numberOfPrices++;
        });
      }
      return Math.round((sum / numberOfPrices));
    }

    $scope.displayedProduct = {
      futuresPrices: null,
      putPrices: null,
      callPrices: null,
      futuresMaturityPrices: null,
      putMaturityPrices: null,
      callMaturityPrices: null,
      center: 0,
      strikeInterval: 0,
      strikesNumber: 10,
      strikesPercent: 10
    }

    /**
     * Initialize the object $scope.allProduct and $scope.displayProduct
     * + display the spinner during the operation
     * @param codeProduct --> productId of a product
     */
    $scope.getProductInformations = function(codeProduct) {
      if ($scope.productNameOrProductIdList.indexOf(codeProduct) !== -1) {
        $scope.startSpin();

        var product = ProductInformation.get({productId: codeProduct}, function() {
          $scope.allProduct = product;

          $scope.displayedProduct.bloombergId = product.bloombergId;
          $scope.displayedProduct.bloombergUrl = product.bloombergUrl;
          $scope.displayedProduct.futuresPrices = angular.copy(product.futuresPrices);
          $scope.displayedProduct.putPrices = angular.copy(product.putPrices);
          $scope.displayedProduct.callPrices = angular.copy(product.callPrices);
          $scope.displayedProduct.currency = product.currency;
          $scope.displayedProduct.isin = product.isin;
          $scope.displayedProduct.marginStyle = product.marginStyle;
          $scope.displayedProduct.productId =  product.productId
          $scope.displayedProduct.productName = product.productName
          $scope.displayedProduct.tickSize = product.tickSize;
          $scope.displayedProduct.tickValue = product.tickValue;
          $scope.displayedProduct.futuresMaturityPrices = null;
          $scope.displayedProduct.putMaturityPrices = null;
          $scope.displayedProduct.callMaturityPrices = null;
          $scope.displayedProduct.center = initCenter();
          $scope.displayedProduct.strikesNumber = 10;
          $scope.displayedProduct.strikesPercent = 10;

          console.log($scope.allProduct)
          $scope.stopSpin();
          $scope.showTable = true;
        });
      } else {
        $scope.showTable = false;
      }
    }


    /*********** Watcher to update the products displayed in real time ************/
    /**
     * Watch when future maturity is change by the user
     */
    $scope.$watch(
      function() { return $scope.displayedProduct.futuresMaturityPrices},
      function() {
        if ($scope.allProduct) {
          updateDisplayedProduct();
        }
      });

    /**
     * Watch when put maturity is change by the user
     */
    $scope.$watch(
      function() { return $scope.displayedProduct.putMaturityPrices},
      function() {
        if ($scope.allProduct) {
          updateDisplayedProduct();
        }
      });

    /**
     * Watch when call maturity is change by the user
     */
    $scope.$watch(
      function() { return $scope.displayedProduct.callMaturityPrices},
      function() {
        if ($scope.allProduct) {
          updateDisplayedProduct();
        }
      });

    /**
     * Watch when center is change by the user
     */
    $scope.$watch(
      function() { return $scope.displayedProduct.center},
      function() {
        if ($scope.allProduct) {
          updateDisplayedProduct();
        }
      });

    /**
     * Watch when strikes number is change by the user
     */
    $scope.$watch(
      function() { return $scope.displayedProduct.strikesNumber},
      function() {
        if ($scope.allProduct) {
          updateDisplayedProduct();
        }
      });

    /**
     * Watch when strikes percent is change by the user
     */
    $scope.$watch(
      function() { return $scope.displayedProduct.strikesPercent},
      function() {
        if ($scope.allProduct) {
          updateDisplayedProduct();
        }
      });

    /**
     * Watch when the user switch between strikes per cent and strikes number
     */
    $scope.$watch(
      function() { return $scope.displayedProduct.strikeInterval},
      function() {
        if ($scope.allProduct) {
          updateDisplayedProduct();
        }
      });

    /*********************** End watchers *********************************/

    function updateDisplayedProductMaturity() {
      if ($scope.instrumentType === 1) {
        if ($scope.displayedProduct.putMaturityPrices) {
          $scope.displayedProduct.putPrices = {};
          $scope.displayedProduct.putPrices[$scope.displayedProduct.putMaturityPrices]
            = angular.copy($scope.allProduct.putPrices[$scope.displayedProduct.putMaturityPrices]);
        } else {
          angular.copy($scope.allProduct.putPrices, $scope.displayedProduct.putPrices);
        }
        if ($scope.displayedProduct.callMaturityPrices) {
          $scope.displayedProduct.callPrices = {};
          $scope.displayedProduct.callPrices[$scope.displayedProduct.callMaturityPrices]
            = angular.copy($scope.allProduct.callPrices[$scope.displayedProduct.callMaturityPrices]);
        } else {
          angular.copy($scope.allProduct.callPrices, $scope.displayedProduct.callPrices);
        }
      } else {
        if ($scope.displayedProduct.futuresMaturityPrices) {
          $scope.displayedProduct.futuresPrices = {};
          $scope.displayedProduct.futuresPrices[$scope.displayedProduct.futuresMaturityPrices]
            = angular.copy($scope.allProduct.futuresPrices[$scope.displayedProduct.futuresMaturityPrices]);
        } else {
          angular.copy($scope.allProduct.futuresPrices, $scope.displayedProduct.futuresPrices);
        }
      }
    }

    function updateDisplayedProductStrikes(delta) {
      for (var putMaturity in $scope.displayedProduct.putPrices) {
        var tabPut = $scope.displayedProduct.putPrices[putMaturity];
        var index = tabPut.length - 1;
        while (index >= 0) {
          if (tabPut[index].exercisePrice < ($scope.displayedProduct.center - delta)
            || tabPut[index].exercisePrice > ($scope.displayedProduct.center + delta)) {
            tabPut.splice(index, 1);
          }
          index -= 1;
        }
      }
      for (var callMaturity in $scope.displayedProduct.callPrices) {
        var tabCall = $scope.displayedProduct.callPrices[callMaturity];
        var index = tabCall.length - 1;
        while (index >= 0) {
          if (tabCall[index].exercisePrice < ($scope.displayedProduct.center - delta)
            || tabCall[index].exercisePrice > ($scope.displayedProduct.center + delta)) {
            tabCall.splice(index, 1);
          }
          index -= 1;
        }
      }

    }

    function updateDisplayedProduct() {

      /********** 1. select in all the prices the ones which satisfy the maturity date **********/
      updateDisplayedProductMaturity();

      /********** 2. select in all the prices remaining the ones which satisfy center and strike gap **********/
      if ($scope.instrumentType === 1) {
        // If change by strike number
        if ($scope.displayedProduct.strikeInterval == 1) {
          updateDisplayedProductStrikes($scope.displayedProduct.strikesNumber);
        } else if ($scope.displayedProduct.strikeInterval == 2) {
          updateDisplayedProductStrikes($scope.displayedProduct.center * ($scope.displayedProduct.strikesPercent / 100));
        }
      }
    };

    /**
     *
     * @param isPut : true if the change if on putMaturity, false if it is on callMaturity (not used in futures case)
     * @returns {Array}
     */
    $scope.getAllMaturities = function(isPut) {
      if ($scope.instrumentType === 1) {
        if (isPut) {
          return Object.keys($scope.allProduct.putPrices);
        } else {
          return Object.keys($scope.allProduct.callPrices);
        }
      } else {
        return Object.keys($scope.allProduct.futuresPrices);
      }
    }
  }

  function ParametersController ($scope, SharedVariables) {

    $scope.portfolioName = "";

    $scope.popup1 = {
      opened: false
    };

    $scope.popup2 = {
      opened: false
    };

    $scope.isLinked = true;

    $scope.isValidPortfolioName = function() {
      return ($scope.portfolioName.length >= 5);
    }

    $scope.popup1.isValidDate = function() {
      return ($scope.valuationDate instanceof Date);
    }

    $scope.popup2.isValidDate = function() {
      return ($scope.positionDate instanceof Date);
    }

    $scope.popup1.today = function() {
      $scope.valuationDate = new Date();
    };

    $scope.popup2.today = function() {
      $scope.positionDate = new Date();
    };

    $scope.popup1.clear = function() {
      $scope.valuationDate = null;
    };

    $scope.popup2.clear = function() {
      $scope.positionDate = null;
    };

    $scope.$watch(
      function() {return $scope.valuationDate;},
      function(newValue) {
        if ($scope.isLinked) {
          $scope.positionDate = $scope.valuationDate;
        }
        SharedVariables.setValuationDate(newValue);
      }
    );

    $scope.$watch(
      function() {return $scope.positionDate;},
      function(newValue) {
        SharedVariables.setPositionDate(newValue);
      }
    );

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

    $scope.open2 = function() {
      $scope.popup2.opened = true;
    };

    $scope.clickLink = function() {
      $scope.isLinked = !$scope.isLinked;
      $scope.positionDate = $scope.valuationDate;
    }
  }
})();
