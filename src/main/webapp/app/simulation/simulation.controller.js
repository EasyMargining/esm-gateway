(function() {
    'use strict';

    angular
        .module('easyMarginingApp')
        .controller('SimulationController', SimulationController)
        .controller('DatePickerController', DatePickerController);

    SimulationController.$inject = ['$scope', '$rootScope', 'Principal', 'LoginService'];

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
