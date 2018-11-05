angular
  .module('cmpPatientPortal')
  .controller('AppointmentsSummaryController', AppointmentsSummaryController);

function AppointmentsSummaryController($state, $stateParams, $rootScope,
                                       BackendService, $window, $translate) {
  var vm = this;
  vm.selection = $stateParams.selection;
  vm.isOffer = vm.selection.schedule.offer;
  var username = ($rootScope.activeProfile) ? $rootScope.activeProfile.pesel : '';

  vm.prepareData = function (selection) {
    var doctor = selection.doctor;
    doctor.branches = doctor.branches.map(function (branch) {
      return branch.id;
    });
    return selection;
  };

  vm.setSelectedPoints = function () {
    vm.selectedPoints = [
      {
        name: 'common.doctor',
        value: vm.selection.doctor.firstName + ' ' + vm.selection.doctor.lastName
      },
      {
        name: 'appointment.shortDescription',
        value: vm.selection.doctor.description
      },
      {
        name: 'appointment.specialisation',
        value: vm.selection.speciality.name
      },
      {
        name: 'appointment.branchAddress',
        value: vm.selection.branch.name + ', ' + vm.selection.branch.facilityName
      },
      {
        name: 'common.paymentMethod',
        value: vm.selection.payMethod.name
      },
      {
        name: 'appointment.appointmentPrice',
        value: vm.selection.schedule.price
      },
      {
        name: 'appointment.dateAndTime',
        value: vm.selection.schedule.date + ', ' + vm.selection.schedule.time
      }
    ];
  };
  vm.setSelectedPoints();

  vm.translate = function () {
    $translate(['user.cashPaymentMethodMessage', 'user.subscriptionPaymentMethodMessage', 'common.errorAgainTryLater',
      'user.onlinePaymentMethodMessage', 'user.mfzPaymentMethodMessage', 'appointment.registrationError'])
      .then(function (translations) {
        vm.cashMsg = translations['user.cashPaymentMethodMessage'];
        vm.subscriptionMsg = translations['user.subscriptionPaymentMethodMessage'];
        vm.onlineMsg = translations['user.onlinePaymentMethodMessage'];
        vm.mfzMsg = translations['user.mfzPaymentMethodMessage'];
        vm.registrationErrorMessage = translations['appointment.registrationError'];
        vm.errorAgainTryLater = translations['common.errorAgainTryLater'];
        vm.onPayMethodReceived(vm.selection.payMethod.name);
      });
  };

  $rootScope.$on('$translateChangeSuccess', function () {
    vm.translate();
  });
  vm.translate();


  vm.onPayMethodReceived = function (payMethodName) {
    switch (payMethodName) {
      case 'Cash':
        vm.message = vm.cashMsg;
        break;
      case 'Subscription':
        vm.message = vm.subscriptionMsg;
        break;
      case 'Online':
        vm.message = vm.onlineMsg;
        break;
      case 'NFZ':
        vm.message = vm.mfzMsg;
    }
  };

  vm.onPayMethodReceived(vm.selection.payMethod.name);

  vm.confirm = function () {
    vm.loading = true;
    var data = vm.prepareData(angular.copy(vm.selection));
    BackendService.send({
      method: "POST",
      url: "api/appointments/registration/" + username,
      data: data
    }).then(vm.onResult);
  };

  vm.onResult = function (response) {
    switch (response.status) {
      case 200:
        $state.go('main.appointments-registration.appointments-registration-finish', {selection: vm.selection});
        break;
      case 400:
        vm.loading = false;
        vm.error = true;
        vm.errorMessage = response.data.message;
        break;
      default:
        vm.loading = false;
        var status = response.status + '';
        if (/^[45]/.test(status)) {
          vm.error = true;
          vm.errorMessage = vm.registrationErrorMessage;
        }
        break;
    }
  };

  vm.back = function () {
    $state.go("main.appointments-registration.schedules", {selection: vm.selection});
  };

  vm.saveAppointmentAndStartTransaction = function () {
    vm.loading = true;
    vm.timeout = false;
    var data = vm.prepareData(angular.copy(vm.selection));
    BackendService.send({
      method: 'POST',
      url: 'api/profile/' + username + '/appointments/online',
      data: data,
      config: {timeout: 60000}
    }).then(vm.onStartTransactionResponse)
  };

  vm.onStartTransactionResponse = function (response) {
    switch (response.status) {
      case 200:
        $window.location.href = response.data.message;
        break;
      case -1:
        vm.loading = false;
        vm.timeout = true;
        vm.errorMessage = vm.errorAgainTryLater;
        break;
      default:
        vm.loading = false;
        vm.error = true;
        vm.errorMessage = vm.errorAgainTryLater;
        break;
    }
  }

}
