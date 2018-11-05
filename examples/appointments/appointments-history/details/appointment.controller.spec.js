describe('patient appointment controller', function () {
  var ctrl, $uibModalInstance;

  beforeEach(module('cmpPatientPortal'));

  beforeEach(function () {
    $uibModalInstance = jasmine.createSpyObj('modal', ['dismiss']);
    ctrl = new AppointmentController({id: 1, doctor:{firstName: 'Mighty', lastName: 'Joe'}},
                                      $uibModalInstance);
  });

  it ('should have controller defined', function () {
    expect(ctrl).toBeDefined();
  });

  it ('should have appointment defined', function () {
    expect(ctrl.appointment.id).toEqual(1);
  });

  it ('should have appointment.doctor.name defined', function () {
    expect(ctrl.appointment.doctor.name).toEqual('Mighty Joe');
  });

  it ('should call $uibModalInstance dismiss', function () {
    ctrl.closeModal();
    expect($uibModalInstance.dismiss).toHaveBeenCalled();
  });
});
