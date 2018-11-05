describe('appointment schedules controller', function () {
  var ctrl, $rootScope, $state, BackendService,
    $httpBackend, backend, $q, $stateParams, $scope, $controller, $translate;

  beforeEach(module('cmpPatientPortal'));
  beforeEach(inject(function (_$rootScope_, _$state_, _$stateParams_,
                    _BackendService_, _$httpBackend_, _backend_, _$q_, _$translate_, _$controller_) {
    $rootScope = _$rootScope_;
    $state = _$state_;
    $stateParams = _$stateParams_;
    BackendService = _BackendService_;
    $httpBackend = _$httpBackend_;
    backend = _backend_;
    $q = _$q_;
    $controller = _$controller_;
    $translate = _$translate_;
    $scope = $rootScope.$new();
    ctrl = $controller('AppointmentsSchedulesController', {
      BackendService: BackendService,
      $state: $state,
      $stateParams: $stateParams,
      $scope: $scope,
      $rootScope: $rootScope,
      $translate: $translate
    });
    ctrl.selection = {speciality:{optionId: 1}, branch:{id: 1, facilityId: 2},
    doctor:{icId: 3}, payMethod:{name: 'MFZ'}};
  }));

  it('should have controller defined and dependencies injected', function () {
    expect(ctrl).toBeDefined();
    expect($state).toBeDefined();
    expect(BackendService).toBeDefined();
  });

  it('should have config defined', function () {
    expect(ctrl.uiConfig.calendar).toBeDefined();
  });

  it('should fetch schedules from Backend', function () {
    var schedules = [{startTime: '2017-01-01', endTime: '2017-01-02'}];
    $httpBackend.when('POST', backend + ctrl.url)
      .respond(200, schedules);
    var callback = jasmine.createSpy('callback');
    spyOn(BackendService, 'send').and.callThrough();
    ctrl.getEvents('2017-01-01', '2017-01-03', '', callback);
    $httpBackend.flush();
    expect(BackendService.send).toHaveBeenCalled();
    schedules[0].start = '2017-01-01';
    schedules[0].end = '2017-01-02';
    expect(callback).toHaveBeenCalledWith(schedules);
  });

  it('should save chosen schedule and move to next step', function () {
    var schedule = {start: '2017-01-01', end: '2017-01-02'};
    spyOn($state, 'go');
    ctrl.onEventClick(schedule);
    expect(ctrl.selection.schedule).toEqual(schedule);
    expect($state.go).toHaveBeenCalled();
  });

  it('should move to previous step', function () {
    spyOn($state, 'go');
    ctrl.back();
    expect($state.go).toHaveBeenCalled();
  });

});

