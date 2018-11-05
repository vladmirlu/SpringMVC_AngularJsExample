describe('appointments registration controller', function () {
  var vm, $scope, BackendService, $state, $httpBackend, backend, $q;

  beforeEach(module('cmpPatientPortal'));

  beforeEach(inject(function (_$controller_, _$rootScope_, _BackendService_,
                              _$state_, _$httpBackend_, _backend_, _$q_) {
    $scope = _$rootScope_.$new();
    $rootScope = _$rootScope_;
    $scope.activeProfile = {pesel: '1234', nfzConfirmed: true};
    $rootScope.activeProfile = {pesel: '1234', nfzConfirmed: true};
    BackendService = _BackendService_;
    $state = _$state_;
    $httpBackend = _$httpBackend_;
    backend = _backend_;
    $q = _$q_;
    vm = _$controller_('AppointmentsRegistrationController',
      {
        $scope: $scope,
        $rootScope: $rootScope
      });

  }));

  it('should have controller and BackendService defined', function () {
    expect(vm).toBeDefined();
    expect(BackendService).toBeDefined();
  });

  it('should allow registration and go to the next page', function () {
    spyOn($state, 'go');
    $httpBackend.when('GET', backend + 'api/appointments/limitation/' + $scope.activeProfile.pesel).respond(200, 'data');
    var defer = $q.defer();
    defer.resolve({status: 200});
    $scope.$digest();
    $httpBackend.flush();
    expect(vm.availableAppointmentsSize).toEqual('data');
    expect($state.go).toHaveBeenCalled();
    expect(vm.errorAppointment).toBeFalsy();
  });

  it('should not allow over limit registration', function () {
    spyOn($state, 'go');
    $httpBackend.when('GET', backend + 'api/appointments/limitation/' + $scope.activeProfile.pesel).respond(200, 0);
    var defer = $q.defer();
    defer.resolve({status: 200});
    $scope.$digest();
    $httpBackend.flush();
    expect(vm.availableAppointmentsSize).toEqual(0);
    expect($state.go).not.toHaveBeenCalled();
    expect(vm.errorAppointment).toBeFalsy();
  });

  it('should get error message of registration', function () {
    spyOn($state, 'go');
    $httpBackend.when('GET', backend + 'api/appointments/limitation/' + $scope.activeProfile.pesel).respond(400, 'data');
    var defer = $q.defer();
    defer.resolve({status: 400});
    $scope.$digest();
    $httpBackend.flush();
    expect($state.go).not.toHaveBeenCalled();
    expect(vm.errorAppointment).toBeTruthy();
  });
});

