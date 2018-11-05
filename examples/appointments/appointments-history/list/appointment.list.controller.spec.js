describe('appointments list controller', function () {

  var ctrl, $scope, BackendService, toastr, $uibModal, $q, $translate, $rootScope, defer;

  beforeEach(module('cmpPatientPortal'));
  beforeEach(inject(function (_$rootScope_, _$controller_, _NgTableParams_,
  _BackendService_, _$q_, _$uibModal_) {
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
    BackendService = _BackendService_;
    toastr = jasmine.createSpyObj('toastr', ['error']);
    $uibModal = _$uibModal_;
    $q = _$q_;
    defer = $q.defer();
    $translate = jasmine.createSpy('$translate').and.returnValue(defer.promise);
    ctrl = new AppointmentListController($scope, BackendService,
      _NgTableParams_, toastr, $uibModal, $translate, $rootScope);
  }));

  it('is defined', function () {
    expect(ctrl).toBeDefined();
  });

  it('has table params for ng-table', function () {
    expect(ctrl.tableParams).toBeDefined();
  });

  it('should refresh appointments list on username change', function () {
    spyOn(ctrl.tableParams, 'reload');
    $scope.activeProfile = {pesel: '321'};
    $scope.$digest();
    expect(ctrl.tableParams.reload).toHaveBeenCalled();
    expect(ctrl.username).toEqual('321');
  });

  it('should call BackendService', function () {
    ctrl.username = '123';
    spyOn(BackendService, 'send').and.callThrough();
    ctrl.getAppointments({
      page: function () { return 1},
      count: function () { return 10}
    });
    expect(BackendService.send).toHaveBeenCalled();
  });

  it('should update total results number on table ' +
    'and return current viewed page items', function () {
    spyOn(ctrl.tableParams, 'total');
    var response = {data: {content: [], totalElements: 200}};
    var result = ctrl.onAppointmentsReceived(response);
    expect(ctrl.tableParams.total).toHaveBeenCalledWith(response.data.totalElements);
    expect(result).toEqual(response.data.content)
  });

  it('should show error toast if no response received', function () {
    ctrl.onAppointmentsReceived();
    expect(toastr.error).toHaveBeenCalled();
  });

  it('should show appointment details', function () {
    spyOn($uibModal, 'open');
    ctrl.showAppointment({});
    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should do nothing when no action chosen', function () {
    var defer = $q.defer();
    defer.resolve({status: 200});
    spyOn($uibModal, 'open').and.callThrough();
    spyOn(BackendService, 'send').and.returnValue(defer.promise);
    spyOn(ctrl.tableParams, 'reload');
    var modalInstance = ctrl.cancel({id:1});
    $scope.$digest();
    modalInstance.dismiss();
    $scope.$digest();
    expect($uibModal.open).toHaveBeenCalled();
    expect(BackendService.send).not.toHaveBeenCalled();
    expect(ctrl.tableParams.reload).not.toHaveBeenCalled();
  });

  it('should cancel appointment and refresh table', function () {
    var defer = $q.defer();
    defer.resolve({status: 200});
    spyOn($uibModal, 'open').and.callThrough();
    spyOn(BackendService, 'send').and.returnValue(defer.promise);
    spyOn(ctrl.tableParams, 'reload');
    var modalInstance = ctrl.cancel({id:1});
    $scope.$digest();
    modalInstance.close({id:1});
    $scope.$digest();
    expect($uibModal.open).toHaveBeenCalled();
    expect(BackendService.send).toHaveBeenCalled();
    expect(ctrl.tableParams.reload).toHaveBeenCalled();
  });

  it('should show error if could not cancel appointment', function () {
    var defer = $q.defer();
    defer.resolve({status: 500});
    spyOn($uibModal, 'open').and.callThrough();
    spyOn(BackendService, 'send').and.returnValue(defer.promise);
    spyOn(ctrl.tableParams, 'reload');
    var modalInstance = ctrl.cancel({id:1});
    $scope.$digest();
    modalInstance.close({id:1});
    $scope.$digest();
    expect($uibModal.open).toHaveBeenCalled();
    expect(BackendService.send).toHaveBeenCalled();
    expect(ctrl.tableParams.reload).not.toHaveBeenCalled();
    expect(toastr.error).toHaveBeenCalled();
  });

  it('should show error if appointment cancellation denied ', function () {
    var defer = $q.defer();
    defer.resolve({status: 403, data: {message: "message here"}});
    spyOn($uibModal, 'open').and.callThrough();
    spyOn(BackendService, 'send').and.returnValue(defer.promise);
    spyOn(ctrl.tableParams, 'reload');
    var modalInstance = ctrl.cancel({id:1});
    $scope.$digest();
    modalInstance.close({id:1});
    $scope.$digest();
    expect($uibModal.open).toHaveBeenCalled();
    expect(BackendService.send).toHaveBeenCalled();
    expect(ctrl.tableParams.reload).not.toHaveBeenCalled();
    expect(toastr.error).toHaveBeenCalled();
  });

  it('should call translate() on event', function () {
    spyOn(ctrl, 'translate');
    $rootScope.$broadcast('$translateChangeSuccess');
    $rootScope.$digest();
    expect(ctrl.translate).toHaveBeenCalled();
  });

  it('should call $translate for translation', function () {
    defer.resolve({
      'appointment.cancellationErrorMessage': 'error message',
      'appointment.cancellationImpossibleMessage': 'cancellation impossible'});
    ctrl.translate();
    $scope.$digest();
    expect($translate).toHaveBeenCalled();
    expect(ctrl.cancellationError).toBeDefined();
    expect(ctrl.cancellationDenied).toBeDefined();
  });

});
