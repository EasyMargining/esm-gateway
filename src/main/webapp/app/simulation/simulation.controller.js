(function() {
  'use strict';

  angular
    .module('easyMarginingApp')
    .controller('SimulationController', SimulationController)
    .controller('AddPositionController', AddPositionController)
    .controller('ParametersController', ParametersController);

  SimulationController.$inject = ['$scope', '$rootScope', 'Principal', 'LoginService'];
  AddPositionController.$inject = ['$scope'];
  ParametersController.$inject = ['$scope', 'WizardHandler'];

  function SimulationController ($scope, $rootScope, Principal, LoginService ) {

    $rootScope.resetIsAdd = function() {
      console.log("in resetIsAdd")
      $rootScope.isAdd = 0;
    }

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

  function ParametersController ($scope, WizardHandler) {

    $scope.portfolioName = "";

    $scope.isValidDate = function() {
      return ($scope.dt instanceof Date);
    }

    $scope.isValidPortfolioName = function() {
      return ($scope.portfolioName.length >= 5);
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
