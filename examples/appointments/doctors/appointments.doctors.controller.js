angular
  .module('cmpPatientPortal')
  .controller('AppointmentsDoctorsController', AppointmentsDoctorsController);

function AppointmentsDoctorsController(BackendService, $state, $stateParams) {
  var vm = this;
  vm.doctors = [];
  vm.selection = $stateParams.selection;

  vm.getDoctors = function () {
    BackendService.send({
      method: 'POST',
      url: 'api/doctors',
      data: {
        serviceOptionId: vm.selection.speciality.optionId,
        facilityId: vm.selection.branch.facilityId,
        locationId: vm.selection.branch.id
      }
    }).then(function (response) {
      switch (response.status){
        case 200:
          vm.doctors = response.data;
          break;
      }
    });
  };

  vm.getDoctors();

  vm.select = function (doctor) {
    vm.selection.doctor = doctor;
    $state.go("main.appointments-registration.appointments-payment-method", {selection: vm.selection});
  };

  vm.back = function () {
    $state.go("main.appointments-registration.branches", {selection: vm.selection});
  };
}
