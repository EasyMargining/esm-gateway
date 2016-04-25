(function() {
  'use strict';

  angular
    .module('easyMarginingApp')
    .controller('SimulationController', SimulationController)
    .controller('AddPositionController', AddPositionController)
    .controller('ParametersController', ParametersController);

  SimulationController.$inject = ['$scope', '$rootScope', 'Principal', 'LoginService', 'Portfolio', 'Account', 'User', 'Positions', 'Position'];
  AddPositionController.$inject = ['$scope'];
  ParametersController.$inject = ['$scope'];

  function SimulationController ($scope, $rootScope, Principal, LoginService, Portfolio, Account, User, Positions, Position) {

    $rootScope.resetIsAdd = function() {
      $rootScope.isAdd = 0;
    }

    $rootScope.loadPositions = function(portfolioName) {

      var portfolioResource = $rootScope.portfolios.filter(function( obj ) {
        return obj.name === portfolioName;
      });

      //To avoid useless call to the server
      if (!$rootScope.portfolio || $rootScope.portfolio !== portfolioResource[0]) {
        $rootScope.portfolio = portfolioResource[0];
        $rootScope.resetIsAdd();

        var positions = Positions.query({portfolioId: $rootScope.portfolio.id}, function () {
          $rootScope.positions = positions;
          console.log($rootScope.positions)
        });
      }
    };

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

    var account = Account.get({}, function() {
      var user = User.get({login: account.login}, function() {
        var portfolios = Portfolio.query({owner: user.id}, function() {
          $rootScope.portfolios = portfolios;
          console.log($rootScope.portfolios)
        });
      })
    });

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

  function AddPositionController($scope) {
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
