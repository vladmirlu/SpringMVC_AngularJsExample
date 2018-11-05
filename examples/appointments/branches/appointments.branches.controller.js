angular
  .module('cmpPatientPortal')
  .controller('AppointmentsBranchesController', AppointmentsBranchesController);

function AppointmentsBranchesController(BackendService, $state, $stateParams, BranchService) {
  var vm = this;
  vm.branches = [];
  vm.selection = $stateParams.selection;
  vm.location={};
  vm.url = 'api/services/branches';

  if (!$stateParams.selection)
    $state.go("main.appointments-registration");

  vm.getBranches = function () {
    BackendService
      .send(
        {method: 'POST',
        url: vm.url,
        data: [vm.selection.speciality.optionId]}
        ).then(function (response) {
      vm.branches = response.data;
      BranchService.moveClosestBranchOnTop(response.data)
        .then(function (response) {
          vm.branches = response;
        });

    });
  };

  vm.getBranches();

  vm.select = function (branch) {
    vm.selection.branch = branch;
    $state.go("main.appointments-registration.doctors", {selection: vm.selection});
  };

  vm.back = function () {
    $state.go("main.appointments-registration.specialities", {selection: vm.selection});
  };
}
