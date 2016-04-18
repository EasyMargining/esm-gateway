(function() {
    'use strict';

    angular
        .module('easyMarginingApp')
        .controller('SimulationController', SimulationController)
        .controller('DatePickerController', DatePickerController);

    SimulationController.$inject = ['$scope', 'Principal', 'LoginService'];

    function SimulationController ($scope, Principal, LoginService ) {

        $scope.isAdd = 0;

/*
        $scope.resetIsAdd = function() {
          $scope.isAdd = 0;
        }
*/
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

    function DatePickerController ($scope) {
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
