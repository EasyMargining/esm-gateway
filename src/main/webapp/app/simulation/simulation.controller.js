(function() {
    'use strict';

    angular
        .module('easyMarginingApp')
        .controller('SimulationController', SimulationController)
        .controller('SelectionController', SelectionController)
        .controller('SummaryController', SummaryController)
        .controller('AddPositionController', AddPositionController)
        .controller('MarginController', MarginController);

    SimulationController.$inject = ['$scope', '$filter', 'Principal', 'LoginService', 'PositionsByPortfolio', 'Product', 'MarginResult'];
    SelectionController.$inject = ['$scope', 'Account', 'User', 'Portfolio', 'ngDialog'];
    SummaryController.$inject = ['$scope', 'Position', 'ngDialog', '$filter'];
    AddPositionController.$inject = ['$scope', 'ProductsByInstrumentType', 'ProductInformation', 'usSpinnerService', 'Position', '$filter'];
    MarginController.$inject = ['$scope'];

    function SimulationController ($scope, $filter, Principal, LoginService, PositionsByPortfolio, Product, MarginResult) {

        var vm = this;
        vm.account = null;
        vm.isAuthenticated = null;
        vm.login = LoginService.open;
        vm.valuationDate = null;
        vm.positionDate = null;
        vm.isAdd = 0;   // 0 : display portfolio summary
                        // 1 : display add option
                        // 2 : display add futures

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

        vm.resetIsAdd = function() {
            vm.isAdd = 0;
        }

        /**
         * Load the positions in the portfolio currently selected
         * @param portfolioName : the portfolio currently selected
         */
        vm.loadPositions = function(portfolio) {

            vm.portfolio = portfolio;
            vm.aggregatedPositions = [];
            vm.resetIsAdd();

            vm.valuationDateFormated = $filter('date')( vm.valuationDate, "yyyy-MM-dd");
            vm.positionDateFormated = $filter('date')( vm.positionDate, "yyyy-MM-dd");

            // 'undo' the timezone offset
            //TODO : verify that (working here but not sure that it is working in other timezone)
            vm.valuationDate = new Date(Date.parse(vm.valuationDateFormated));
            vm.positionDate = new Date(Date.parse(vm.positionDateFormated));

            var positions = PositionsByPortfolio.query(
                {portfolioId: vm.portfolio.id, valuationDate: vm.valuationDateFormated},
                function () {
                    positions.forEach(function(position) {
                        var product = Product.get({id: position.productId}, function () {
                            position.product = product;
                        });
                        vm.aggregatedPositions.push(position);
                        console.log(vm.aggregatedPositions)
                    });
                }
            );
        };

        /**
         * Add a position in vm.aggregatedPositions (only update the quantity if a position on
         * this productId already exist)
         * @param position : the position to add
         */
        vm.addPosition = function(position) {
            console.log(position)
            //If the positionDate is higher than the valuationDate we don't need to push the position
            if ($scope.simulationCtrl.positionDate <= $scope.simulationCtrl.valuationDate) {
                var samePos = vm.aggregatedPositions.filter(function (pos) {
                    return pos.productId === position.productId;
                });
                //If a position on this productId already exists
                if (samePos.length > 0) {
                    samePos[0].quantity += parseInt(position.quantity);
                } else {
                    var product = Product.get({id: position.productId}, function () {
                        position.product = product;
                    });
                    vm.aggregatedPositions.push(position);
                }
            }
        };

        vm.calculateMargin = function() {
            var trades = [];

            for (var i in vm.aggregatedPositions) {
                var aggregatedPosition = vm.aggregatedPositions[i];
                var trade = {
                    "exercisePrice": aggregatedPosition.product.exercisePrice,
                    "exerciseStyleFlag": aggregatedPosition.product.exerciseStyleFlag,
                    "expiryDate": {
                        "contractMonth": parseInt(aggregatedPosition.product.maturityDate.substring(5, 7)),
                        "contractYear": parseInt(aggregatedPosition.product.maturityDate.substring(0, 4))
                    },
                    "instrumentType": aggregatedPosition.product.instrumentType,
                    "optionType": aggregatedPosition.product.optionType[0],
                    "portfolioId": aggregatedPosition.portfolioId,
                    "productId": aggregatedPosition.product.productDefinitionId,
                    "productSettlementType": aggregatedPosition.product.productSettlementType,
                    "quantity": aggregatedPosition.quantity,
                    "versionNumber": "0"
                };
                trades.push(trade);
            }

            console.log("trades")
            console.log(trades);

            var marginResult = MarginResult.save({}, trades, function() {
                vm.marginResult = marginResult.portfolioMarginResults;
                console.log("margin result")
                console.log(vm.marginResult)
            });
        };
    };

    function SelectionController ($scope, Account, User, Portfolio, ngDialog) {

        var vm = this;
        vm.portfolios = [];
        vm.portfolioName = "";
        vm.isLinked = true; //if the valuationDate and the positionDate are the same

        // Get the portfolio list of the client currently connected
        vm.account = Account.get({}, function() {
            vm.user = User.get({login: vm.account.login}, function() {
                var portfolios = Portfolio.query({owner: vm.user.id}, function() {
                    vm.portfolios = portfolios;
                    console.log(vm.portfolios)
                });
            })
        });

        vm.openAddPortfolio = function() {
            ngDialog.open({
                template: 'app/simulation/newPortfolioModal.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });

        };

        vm.addPortfolio = function(newPortfolioName) {
            var newPortfolio = new Portfolio();
            newPortfolio.name = newPortfolioName;
            newPortfolio.owner = vm.user.id;

            Portfolio.save(newPortfolio, function () {
                console.log("new portfolio saved " + newPortfolioName)
                vm.portfolios.push(newPortfolio);
                ngDialog.close();
            });
        }

        vm.cancel = function() {
            ngDialog.close();
        }

        /**
         * Verify is the name of the portfolio is long enough
         * @returns true if the portfolio name is long enough
         */
        vm.isValidPortfolioName = function() {
            var isValid = vm.portfolios.filter(function (portfolio) {
                return portfolio.name === vm.portfolioName;
            });
            return isValid.length > 0;
        };

        // Open the validationDate popup
        vm.openValidationDate = function() {
            vm.popupValidationDate.opened = true;
        };

        //Object to handle the validationDate popup
        vm.popupValidationDate = {
            opened: false,
            isValidDate : function() {
                return ($scope.simulationCtrl.valuationDate instanceof Date);
            },
            today : function() {
                $scope.simulationCtrl.valuationDate = new Date();
            },
            clear : function() {
                $scope.simulationCtrl.valuationDate = null;
            }
        };

        // Open the positionDate popup
        vm.openPositionDate = function() {
            vm.popupPositionDate.opened = true;
        };

        //Object to handle the positionDate popup
        vm.popupPositionDate = {
            opened: false,
            isValidDate : function() {
                return ($scope.simulationCtrl.positionDate instanceof Date);
            },
            today : function() {
                $scope.simulationCtrl.positionDate = new Date();
            },
            clear : function() {
                $scope.simulationCtrl.positionDate = null;
            }
        };

        //When validationDate and positionDate are linked they must be the same
        $scope.$watch(
            function() {return $scope.simulationCtrl.valuationDate;},
            function(valuationDate) {
                if (vm.isLinked) {
                    $scope.simulationCtrl.positionDate = valuationDate;
                }
            }
        );

        //When validationDate and positionDate are linked they must be the same
        vm.clickLink = function() {
            vm.isLinked = !vm.isLinked;
            $scope.simulationCtrl.positionDate = $scope.simulationCtrl.valuationDate;
        };

        //Get the portfolio selected
        vm.getPortfolio = function() {
            var portfolioResource = vm.portfolios.filter(function( obj ) {
                return obj.name === vm.portfolioName;
            });
            return portfolioResource[0];
        }
    }

    function SummaryController ($scope, Position, ngDialog, $filter) {

        var vm = this;

        /**
         * Open the confirmation modal to close a position
         * @param position : the position to close
         */
        vm.openClosePosition = function(position) {
            if (position.quantity != 0) {
                $scope.position = position;
                $scope.typeModal = 1;
                ngDialog.open({
                    template: 'app/simulation/confirmationModal.html',
                    className: 'ngdialog-theme-default',
                    scope: $scope
                });
            }
        };

        /**
         * Close the position by passing the inverse of the position given
         * @param position : the position to close
         */
        vm.closePosition = function(position) {
            var pos = new Position();
            pos.portfolioId = $scope.simulationCtrl.portfolio.id;
            pos.productId = position.product.id;
            pos.quantity = -position.quantity;
            pos.exchange = "eurex"; //TODO : Change that
            pos.effectiveDate = $scope.simulationCtrl.valuationDateFormated;

            Position.save(pos, function () {
                var samePos = $scope.simulationCtrl.aggregatedPositions.filter(function (p) {
                    return p.productId === pos.productId;
                });
                samePos[0].quantity = 0;
                ngDialog.close();
            });
        };

        //The old quantity (the one when we focus on the quantity input
        vm.oldQuantity = 0;
        vm.setOldQuantity = function(q) {
            vm.oldQuantity = q;
            console.log(vm.oldQuantity)
        }

        /**
         * Update the quantity of a position and pass position with quantity (new Quantity enter minus the old one)
         * @param position
         */
        vm.updatePosition = function(position) {
            if (position.quantity !== vm.oldQuantity) {
                var pos = new Position();
                pos.portfolioId = $scope.simulationCtrl.portfolio.id;
                pos.productId = position.product.id;
                pos.quantity = position.quantity - vm.oldQuantity;
                console.log("quantity new position")
                console.log(pos.quantity)
                pos.exchange = "eurex"; //TODO : Change that
                pos.effectiveDate = $scope.simulationCtrl.valuationDateFormated;

                Position.save(pos, function () {
                    ngDialog.close();
                });
            }
        };

        vm.cancel = function() {
            ngDialog.close();
        }

/*        /!* DELETE DIALOG *!/
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
        */
    }

    function AddPositionController($scope, ProductsByInstrumentType, ProductInformation, usSpinnerService, Position, $filter) {

        var vm = this;
        vm.currentPosition = null;  // last position opened by the user

        vm.setCurrentPosition = function(_id, isShort) {
            vm.currentPosition = {
                isShort: isShort,
                id: _id
            };
        }

        vm.isPositionSelected = function(_id, isShort) {
            return vm.currentPosition && vm.currentPosition.isShort === isShort
                && vm.currentPosition.id === _id;
        }

        vm.newPositions = [];

        /**
         * Add the position (product and quantity) in the array vm.newPositions
         * @param quantity : the quantity enter by the user corresponding to the product in vm.currentPosition
         */
        vm.addPosition = function(quantity) {
            //!isNaN(parseFloat(quantity)) --> Return true is quantity is a number
            if (quantity && !isNaN(parseFloat(quantity)) && quantity > 0) {
                vm.newPositions.push({productId : vm.currentPosition.id,
                    quantity: (vm.currentPosition.isShort ? -quantity : quantity)});
            }
        }

        /**
         * Create the array containing the new positions as entity in order to persist them in db.
         */
        vm.saveNewPositions = function() {
            var newPos = [];
            for (var i in vm.newPositions) {
                var position = vm.newPositions[i];
                var pos = new Position();
                pos.portfolioId = $scope.simulationCtrl.portfolio.id;
                pos.productId = position.productId;
                pos.quantity = Number(position.quantity);
                pos.exchange = "eurex";
                pos.effectiveDate = $scope.simulationCtrl.positionDate;
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
                    $scope.simulationCtrl.addPosition(p);
                    recursiveSave(pos);
                });
            }
        }

        /**
         * Watch and return the list of assets the page needs (Option or futures)
         */
        $scope.$watch(
            function() { return $scope.simulationCtrl.isAdd},
            function (newValue) {
                var instrumentType = (newValue === 1) ? 'Option' : (newValue === 2) ? 'Future' : '';
                var productNameOrProductDefinitionIdList = ProductsByInstrumentType.query(
                    {instrumentType: instrumentType, effectiveDate: $scope.simulationCtrl.positionDateFormated},
                    function() {
                        vm.productNameOrProductDefinitionIdList = productNameOrProductDefinitionIdList;
                    }
                );
            }
        );

        vm.showTable = false;

        /*********** HANDLER LOADING SPINNER ******************/
        vm.startSpin = function() {
            if (!vm.spinneractive) {
                usSpinnerService.spin('spinner-1');
            }
        };

        vm.stopSpin = function() {
            if (vm.spinneractive) {
                usSpinnerService.stop('spinner-1');
            }
        };
        vm.spinneractive = false;

        $scope.$on('us-spinner:spin', function(event, key) {
            vm.spinneractive = true;
        });

        $scope.$on('us-spinner:stop', function(event, key) {
            vm.spinneractive = false;
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
            for (var maturity in vm.allProduct.callPrices) {
                vm.allProduct.callPrices[maturity].forEach(function(obj) {
                    sum = sum + obj.exercisePrice;
                    numberOfPrices++;
                });
            }
            return Math.round((sum / numberOfPrices));
        }

        vm.displayedProduct = {
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
         * Initialize the object vm.allProduct and vm.displayProduct
         * + display the spinner during the operation
         * @param codeProduct --> productId of a product
         */
        vm.getProductInformations = function(codeProduct) {
            if (vm.productNameOrProductDefinitionIdList.indexOf(codeProduct) !== -1) {
                vm.startSpin();

                var product = ProductInformation.get({productIdentifier: codeProduct, effectiveDate : $scope.simulationCtrl.positionDateFormated}, function() {
                    vm.allProduct = product;
                    vm.displayedProduct.bloombergId = product.bloombergId;
                    vm.displayedProduct.futuresPrices = angular.copy(product.futuresPrices);
                    vm.displayedProduct.putPrices = angular.copy(product.putPrices);
                    vm.displayedProduct.callPrices = angular.copy(product.callPrices);
                    vm.displayedProduct.currency = product.currency;
                    vm.displayedProduct.isin = product.isin;
                    vm.displayedProduct.marginStyle = product.marginStyle;
                    vm.displayedProduct.productDefinitionId =  product.productDefinitionId;
                    vm.displayedProduct.productName = product.productName;
                    vm.displayedProduct.tickSize = product.tickSize;
                    vm.displayedProduct.tickValue = product.tickValue;
                    vm.displayedProduct.effectiveDate = product.effectiveDate;
                    vm.displayedProduct.versionNumber = product.versionNumber;
                    vm.displayedProduct.instrumentType = product.instrumentType;
                    vm.displayedProduct.productSettlementType = product.productSettlementType;
                    vm.displayedProduct.exerciseStyleFlag = product.exerciseStyleFlag;
                    vm.displayedProduct.tradeUnit = product.tradeUnit;
                    vm.displayedProduct.minBlockSize = product.minBlockSize;

                    vm.displayedProduct.futuresMaturityPrices = null;
                    vm.displayedProduct.putMaturityPrices = null;
                    vm.displayedProduct.callMaturityPrices = null;

                    vm.displayedProduct.center = initCenter();
                    vm.displayedProduct.strikesNumber = 10;
                    vm.displayedProduct.strikesPercent = 10;

                    vm.stopSpin();
                    vm.showTable = true;
                });
            } else {
                vm.showTable = false;
            }
        }


        /*********** Watcher to update the products displayed in real time ************/
        /**
         * Watch when future maturity is change by the user
         */
        $scope.$watch(
            function() { return vm.displayedProduct.futuresMaturityPrices},
            function() {
                if (vm.allProduct) {
                    updateDisplayedProduct();
                }
            });

        /**
         * Watch when put maturity is change by the user
         */
        $scope.$watch(
            function() { return vm.displayedProduct.putMaturityPrices},
            function() {
                if (vm.allProduct) {
                    updateDisplayedProduct();
                }
            });

        /**
         * Watch when call maturity is change by the user
         */
        $scope.$watch(
            function() { return vm.displayedProduct.callMaturityPrices},
            function() {
                if (vm.allProduct) {
                    updateDisplayedProduct();
                }
            });

        /**
         * Watch when center is change by the user
         */
        $scope.$watch(
            function() { return vm.displayedProduct.center},
            function() {
                if (vm.allProduct) {
                    updateDisplayedProduct();
                }
            });

        /**
         * Watch when strikes number is change by the user
         */
        $scope.$watch(
            function() { return vm.displayedProduct.strikesNumber},
            function() {
                if (vm.allProduct) {
                    updateDisplayedProduct();
                }
            });

        /**
         * Watch when strikes percent is change by the user
         */
        $scope.$watch(
            function() { return vm.displayedProduct.strikesPercent},
            function() {
                if (vm.allProduct) {
                    updateDisplayedProduct();
                }
            });

        /**
         * Watch when the user switch between strikes per cent and strikes number
         */
        $scope.$watch(
            function() { return vm.displayedProduct.strikeInterval},
            function() {
                if (vm.allProduct) {
                    updateDisplayedProduct();
                }
            });

        /*********************** End watchers *********************************/

        function updateDisplayedProductMaturity() {
            if ($scope.simulationCtrl.isAdd === 1) {
                if (vm.displayedProduct.putMaturityPrices) {
                    vm.displayedProduct.putPrices = {};
                    vm.displayedProduct.putPrices[vm.displayedProduct.putMaturityPrices]
                        = angular.copy(vm.allProduct.putPrices[vm.displayedProduct.putMaturityPrices]);
                } else {
                    angular.copy(vm.allProduct.putPrices, vm.displayedProduct.putPrices);
                }
                if (vm.displayedProduct.callMaturityPrices) {
                    vm.displayedProduct.callPrices = {};
                    vm.displayedProduct.callPrices[vm.displayedProduct.callMaturityPrices]
                        = angular.copy(vm.allProduct.callPrices[vm.displayedProduct.callMaturityPrices]);
                } else {
                    angular.copy(vm.allProduct.callPrices, vm.displayedProduct.callPrices);
                }
            } else {
                if (vm.displayedProduct.futuresMaturityPrices) {
                    vm.displayedProduct.futuresPrices = {};
                    vm.displayedProduct.futuresPrices[vm.displayedProduct.futuresMaturityPrices]
                        = angular.copy(vm.allProduct.futuresPrices[vm.displayedProduct.futuresMaturityPrices]);
                } else {
                    angular.copy(vm.allProduct.futuresPrices, vm.displayedProduct.futuresPrices);
                }
            }
        }

        function updateDisplayedProductStrikes(delta) {
            for (var putMaturity in vm.displayedProduct.putPrices) {
                var tabPut = vm.displayedProduct.putPrices[putMaturity];
                var index = tabPut.length - 1;
                while (index >= 0) {
                    if (tabPut[index].exercisePrice < (vm.displayedProduct.center - delta)
                        || tabPut[index].exercisePrice > (vm.displayedProduct.center + delta)) {
                        tabPut.splice(index, 1);
                    }
                    index -= 1;
                }
            }
            for (var callMaturity in vm.displayedProduct.callPrices) {
                var tabCall = vm.displayedProduct.callPrices[callMaturity];
                var index = tabCall.length - 1;
                while (index >= 0) {
                    if (tabCall[index].exercisePrice < (vm.displayedProduct.center - delta)
                        || tabCall[index].exercisePrice > (vm.displayedProduct.center + delta)) {
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
            if ($scope.simulationCtrl.isAdd === 1) {
                // If change by strike number
                if (vm.displayedProduct.strikeInterval == 1) {
                    updateDisplayedProductStrikes(vm.displayedProduct.strikesNumber);
                } else if (vm.displayedProduct.strikeInterval == 2) {
                    updateDisplayedProductStrikes(vm.displayedProduct.center * (vm.displayedProduct.strikesPercent / 100));
                }
            }
        };

        /**
         *
         * @param isPut : true if the change if on putMaturity, false if it is on callMaturity (not used in futures case)
         * @returns {Array}
         */
        vm.getAllMaturities = function(isPut) {
            if ($scope.simulationCtrl.isAdd === 1) {
                if (isPut) {
                    return Object.keys(vm.allProduct.putPrices);
                } else {
                    return Object.keys(vm.allProduct.callPrices);
                }
            } else {
                return Object.keys(vm.allProduct.futuresPrices);
            }
        }
    }

    function MarginController($scope) {

        var vm = this;

    }
})();
