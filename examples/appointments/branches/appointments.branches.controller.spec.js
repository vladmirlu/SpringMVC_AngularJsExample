describe('appointment branches controller', function () {
  var vm, $scope, $rootScope, BackendService, BranchService,
    $state, $stateParams, $httpBackend, backend, $q;

  beforeEach(module('cmpPatientPortal'));

  beforeEach(inject(function (_$controller_, _$rootScope_, _backend_,
                              _BackendService_, _BranchService_, _$httpBackend_,
                              _$state_, _$stateParams_, _$q_) {
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
    $stateParams = _$stateParams_;
    $state = _$state_;
    BackendService = _BackendService_;
    BranchService = _BranchService_;
    $stateParams.selection = {speciality: {optionId: 23}};
    vm = new AppointmentsBranchesController(BackendService, $state, $stateParams, BranchService);
    $httpBackend = _$httpBackend_;
    backend = _backend_;
    $q = _$q_;
  }));

  it('should have controller defined', function () {
    expect(vm).toBeDefined();
  });

  it('should get branches', function () {
    spyOn(BackendService, 'send').and.callThrough();
    vm.getBranches();
    expect(BackendService.send).toHaveBeenCalled();
  });

  it('should update branches after receiving response', function () {
    var defer = $q.defer();
    defer.resolve({data: 'data'});
    spyOn(BackendService, 'send').and.returnValue(defer.promise);
    spyOn(BranchService, 'moveClosestBranchOnTop').and.returnValue(defer.promise);
    $httpBackend.when('POST', backend + 'api/services/branches').respond(200, {});
    vm.getBranches();
    $rootScope.$digest();
    expect(BranchService.moveClosestBranchOnTop).toHaveBeenCalled();
  });

  it('should move to next registration phase', function () {
    spyOn($state, 'go');
    vm.selection={};
    vm.select({id: 2});
    expect($state.go).toHaveBeenCalled();
  });

  it('should go back', function () {
    spyOn($state, 'go');
    vm.back();
    expect($state.go).toHaveBeenCalled();
  });
});
