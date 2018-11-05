describe('appointments payment method controller', function () {
  var vm, $scope, $state, $stateParams,
    $httpBackend, backend, BackendService, $q;

  beforeEach(module('cmpPatientPortal'));
  beforeEach(inject(function (_BackendService_, _$httpBackend_, 
                              _$controller_, _$rootScope_, _backend_,
                              _$state_, _$stateParams_, _$q_) {
    $scope = _$rootScope_.$new();
    $rootScope = _$rootScope_;
    $scope.activeProfile = {pesel: '1234', nfzConfirmed: true};
    $rootScope.activeProfile = {pesel: '1234', payerId: 5};
    vm = _$controller_('AppointmentsPaymentMethodController',
      {
        $scope: $scope,
        $rootScope : $rootScope
      });
    BackendService = _BackendService_;
    $q = _$q_;
    $httpBackend = _$httpBackend_;
    backend = _backend_;
    $state = _$state_;
    $stateParams = _$stateParams_;
  }));

  beforeEach(function () {
    $stateParams.selection = {speciality: "some"};
  });

  it('has dependencies injected', function () {
    expect(vm).toBeDefined();
    expect($state).toBeDefined();
    expect(vm.tableParams).toBeDefined();
    expect($stateParams).toBeDefined();
  });

  it('should call BackendService to retrieve payment methods', function () {
    spyOn(BackendService, 'send').and.returnValue($q.defer().promise);
    vm.getAvailPayments();
    expect(BackendService.send).toHaveBeenCalled();
  });

  it('should receive and update payment metods', function () {
    response = {data: [], status: 200};
    expect(vm.payMethods).toEqual([]);
    vm.onAvailPaymentsReceived(response);
    expect(vm.payMethods).toEqual(response.data);
  });

  it('should go to the summary registration page', function () {
    spyOn($state, 'go');
    vm.selection = {};
    vm.select({id: 1});
    expect($state.go).toHaveBeenCalled();
  });

  it('should go to the summary registration page with NFZ payment', function () {
    spyOn($state, 'go');
    vm.payerNFZconfirmed = true;
    vm.selection = {};
    vm.select({name: 'NFZ'});
    expect($state.go).toHaveBeenCalled();
  });

  it('should go to the previous step', function () {
    spyOn($state, 'go');
    vm.back();
    expect($state.go).toHaveBeenCalled();
  });
});

