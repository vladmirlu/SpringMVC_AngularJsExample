angular
  .module('cmpPatientPortal')
  .controller('AppointmentsSpecialitiesController', AppointmentsSpecialitiesController);

function AppointmentsSpecialitiesController(BackendService, $state) {
  var vm = this;
  vm.selection = {};

  BackendService.send({method: 'GET', url: 'api/services'})
    .then(function (response) {
      switch (response.status) {
        case 200:
          vm.specialities = response.data;
          break;
      }
    });

  vm.select = function (speciality) {
    vm.selection.speciality = speciality;
    $state.go("main.appointments-registration.branches", {selection: vm.selection});
  };
}
