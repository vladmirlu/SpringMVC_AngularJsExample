angular
  .module('cmpPatientPortal')
  .controller('AppointmentCancelController', AppointmentCancelController);
function AppointmentCancelController (appointment, $uibModalInstance) {
  var ctrl = this;
  ctrl.appointment = appointment;

  ctrl.closeModal = function() {
    $uibModalInstance.dismiss();
  };

  ctrl.cancel = function() {
    $uibModalInstance.close(ctrl.appointment);
  };
}
