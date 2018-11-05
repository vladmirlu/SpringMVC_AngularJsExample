angular
  .module('cmpPatientPortal')
  .controller('AppointmentsRegistrationController', AppointmentsRegistrationController);

function AppointmentsRegistrationController($rootScope, $scope, $state, BackendService) {
  var vm = this;
  vm.userAuthenticated = $rootScope.session.authenticated;

  $scope.$watch('activeProfile.pesel', function () {
    if ($scope.activeProfile && $scope.activeProfile.pesel) {
      vm.pesel = $scope.activeProfile.pesel;

      $rootScope.$watch('activeProfile.nfzConfirmed', function() {
        $scope.activeProfile.nfzConfirmed = $rootScope.activeProfile.nfzConfirmed;
      });
      vm.getActiveAppointments();
    }
  });

  vm.getActiveAppointments = function () {
    BackendService.send({method: "GET", url: 'api/appointments/limitation/' + vm.pesel})
      .then(function (response) {
        if (response.status === 200 && response.data != 0) {
          vm.availableAppointmentsSize = response.data;
          $state.go('main.appointments-registration.specialities');
        } else if (response.status === 200 && response.data === 0) {
          vm.availableAppointmentsSize = response.data;
          vm.overLimit = true;
        } else {
          vm.errorAppointment = true;
        }
     });
   };
}

