describe('patient appointment cancellation controller', function () {
  var ctrl, $uibModalInstance;

  beforeEach(module('cmpPatientPortal'));

  beforeEach(function () {
    $uibModalInstance = jasmine.createSpyObj('modal', ['dismiss', 'close']);
    ctrl = new AppointmentCancelController({id: 1}, $uibModalInstance);
  });

  it ('should have controller defined', function () {
    expect(ctrl).toBeDefined();
  });

  it ('should have appointment defined', function () {
    expect(ctrl.appointment).toEqual({id: 1});
  });

  it ('should call $uibModalInstance dismiss', function () {
    ctrl.closeModal();
    expect($uibModalInstance.dismiss).toHaveBeenCalled();
  });

  it ('should call $uibModalInstance close', function () {
    ctrl.cancel();
    expect($uibModalInstance.close).toHaveBeenCalledWith({id: 1});
  });
});
