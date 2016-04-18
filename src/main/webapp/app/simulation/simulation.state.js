(function() {
    'use strict';

    angular
        .module('easyMarginingApp')
        .config(stateConfig);

    stateConfig.$inject = ['$stateProvider'];

    function stateConfig($stateProvider) {
        $stateProvider.state('simulation', {
            parent: 'app',
            url: '/simulation',
            data: {
                authorities: []
            },
            views: {
                'content@': {
                    templateUrl: 'app/simulation/simulation.html',
                    controller: 'SimulationController',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                mainTranslatePartialLoader: ['$translate', '$translatePartialLoader', function ($translate,$translatePartialLoader) {
                    $translatePartialLoader.addPart('simulation');
                    return $translate.refresh();
                }]
            }
        });
    }
})();
