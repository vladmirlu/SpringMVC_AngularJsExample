angular
  .module('cmpPatientPortal')
  .controller('AppointmentsPaymentMethodController', AppointmentsPaymentMethodController);

function AppointmentsPaymentMethodController(BackendService, NgTableParams, $state,
                                             $stateParams, $rootScope, $scope, $translate) {
  var vm = this;
  vm.selection = $stateParams.selection;
  vm.payMethods = [];
  var allowedPaymentMethods = ['Cash'];

  if (!$stateParams.selection)
    $state.go("main.appointments-registration");
  
  vm.getAvailPayments = function () {
    BackendService.send({
      method: "GET",
      url: "api/payments"
    })
      .then(vm.onAvailPaymentsReceived);
  };

  vm.onAvailPaymentsReceived = function (response) {
    switch (response.status) {
      case 200:
        var condition = null;
        if($rootScope.session.authenticated){
          condition = function (method) {
            if(method.name === 'NFZ')
              return $scope.activeProfile.nfzConfirmed;
            if(method.name === 'Subscription')
              return $scope.activeProfile.payerConfirmed;
            return true;
          };
        }
        else{
          condition = function (method) {
            return (allowedPaymentMethods.indexOf(method.name) !== -1);
          };
        }
        vm.payMethods = response.data.filter(condition);
        break;
    }
  };

  vm.select = function (payMethod) {
    vm.selection.payMethod = payMethod;
    $state.go("main.appointments-registration.schedules", {selection: vm.selection});
  };

  vm.back = function () {
    $state.go('main.appointments-registration.doctors', {selection: vm.selection});
  };

  vm.translation = {
    ids: ['payer.unconfirmedNFZ']
  };

  vm.translate = function () {
    $translate(vm.translation.ids)
      .then(function (translations) {
        vm.translation.result = translations;
      });
  };
  
  $rootScope.$on('$translateChangeSuccess', function() {vm.translate()});

  // --------- main ----------
  vm.translate();
  
  vm.getAvailPayments();

  vm.tableParams = new NgTableParams({}, {
    getData: vm.payMethods
  });
}

