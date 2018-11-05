describe('appointments controller', function () {
  var self, $rootScope, $state, BackendService, $httpBackend, backend, $q;

  beforeEach(module('cmpPatientPortal'));
  beforeEach(inject(function (_$rootScope_, _$state_,
                    _BackendService_, _$httpBackend_, _backend_, _$q_) {
    $rootScope = _$rootScope_;
    $state = _$state_;
    BackendService = _BackendService_;
    $httpBackend = _$httpBackend_;
    backend = _backend_;
    $q = _$q_;
    self = new AppointmentsSpecialitiesController(BackendService, $state);
  }));

  it('should show all services', function () {
    $httpBackend.when('GET', backend + 'api/services').respond(200, 'data');
    var defer = $q.defer();
    defer.resolve({status: 200});
    $httpBackend.flush();
    $rootScope.$digest();
    expect(self.specialities).toEqual('data');
  });

  it('should select doctor speciality', function () {
    spyOn($state, 'go');
    self.select();
    expect($state.go).toHaveBeenCalled();
  });

  it('has dependencies injected', function () {
    expect($state).toBeDefined();
    expect(BackendService).toBeDefined();
  });

});

