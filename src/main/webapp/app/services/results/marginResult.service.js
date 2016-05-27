(function () {
    'use strict';

    angular
        .module('easyMarginingApp')
        .factory('MarginResult', MarginResult);

    MarginResult.$inject = ['$resource'];

    function MarginResult ($resource) {
        var service = $resource('/esmeurexengine/api/margin/computeEtd', {}, {
            'save': { method:'POST' }
        });

        return service;
    }
})();
