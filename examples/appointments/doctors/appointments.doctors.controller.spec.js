describe('appointment doctors controller', function () {
  var vm, $scope, $rootScope, BackendService,
    $state, $stateParams, $httpBackend, backend;

  beforeEach(module('cmpPatientPortal'));

  beforeEach(inject(function (_$controller_, _$rootScope_, _backend_,
                              _BackendService_, _$httpBackend_,
                              _$state_, _$stateParams_) {
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
    $stateParams = _$stateParams_;
    $state = _$state_;
    BackendService = _BackendService_;
    $stateParams.selection = {speciality: {optionId: 23}, branch: {id: 1, facilityId: 1}};
    vm = new AppointmentsDoctorsController(BackendService, $state, $stateParams);
    $httpBackend = _$httpBackend_;
    backend = _backend_;
  }));

  it('should have controller defined', function () {
    expect(vm).toBeDefined();
  });

  it('should get doctors', function () {
    spyOn(BackendService, 'send').and.callThrough();
    vm.getDoctors();
    expect(BackendService.send).toHaveBeenCalled();
  });

  it('should update doctors after response received', function () {
    $httpBackend.when('POST', backend + 'api/doctors').respond(200, 'data');
    vm.getDoctors();
    $httpBackend.flush();
    $rootScope.$digest();
    expect(vm.doctors).toEqual('data');
  });

  it('should move to next phase', function () {
    spyOn($state, 'go');
    vm.selection={};
    vm.select({});
    expect($state.go).toHaveBeenCalled();
  });

  it('should go back', function () {
    spyOn($state, 'go');
    vm.back();
    expect($state.go).toHaveBeenCalled();
  });
});
