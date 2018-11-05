angular
  .module('cmpPatientPortal')
  .controller('AppointmentController', AppointmentController);
function AppointmentController (appointment, $uibModalInstance) {
  var ctrl = this;
  ctrl.appointment = appointment;
  ctrl.appointment.doctor.name = appointment.doctor.firstName
                                  + ' ' + appointment.doctor.lastName;

  ctrl.closeModal = function() {
    $uibModalInstance.dismiss('cancel');
  };
}
