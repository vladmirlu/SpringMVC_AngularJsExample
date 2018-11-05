describe('appointments registration summary controller', function () {
  var self, $state, $scope, BackendService,
    $stateParams, $q, $window, defer, $translate, $rootScope;

  beforeEach(module('cmpPatientPortal'));
  beforeEach(inject(function ( _$controller_, _$rootScope_,_BackendService_,
                              _$q_, _$state_, _$stateParams_) {
    $scope = _$rootScope_.$new();
    $rootScope = _$rootScope_;
    $rootScope.activeProfile = {};
    BackendService = _BackendService_;
    $q = _$q_;
    defer = $q.defer();
    $translate = jasmine.createSpy('$translate').and.returnValue(defer.promise);
    $state = _$state_;
    $stateParams = _$stateParams_;
    $stateParams.selection = {speciality: "some", branch: "some", payMethod: "some", doctor: {branches: []},
                              schedule: {date: new Date(), time: new Date()}};
    $window = {location: {href: ''}};
    self = _$controller_('AppointmentsSummaryController', {
        $scope: $scope,
        $stateParams: $stateParams,
        $rootScope: $rootScope,
        $window: $window,
        $translate: $translate
    });
    self.cashMsg = ' so come please for 15 minutes before appointment time to pay for the visit ';
    self.subscriptionMsg = '. Your subscription is active';
    self.onlineMsg = ' online functionality is coming soon';
    self.mfzMsg = " so come please for 15 minutes before the visit time to fill the 'MFZ registry form'.  Or you can fill the 'MFZ registry form' by yourself. If you wanna to do that click on the link below";
  }));

  it('should go back from the summary page of registration', function () {
    spyOn($state, 'go');
    self.back();
    expect($state.go).toHaveBeenCalled();
  });

  it('should go to the final registration page', function () {
    spyOn($state, 'go');
    var response = {status : 200};
    self.onResult(response);
    expect($state.go).toHaveBeenCalled();
  });

  it('should show error message of registration', function () {
    var response = {status : 400, data: {errorMessage: "msg"}};
    self.onResult(response);
    expect(self.error).toBeTruthy();
  });

  it('should call BackendService to get registration status', function () {
    spyOn(BackendService, 'send').and.returnValue($q.defer().promise);
    self.confirm();
    expect(BackendService.send).toHaveBeenCalled();
  });

  it('has dependencies injected', function () {
    expect(self).toBeDefined();
    expect($state).toBeDefined();
    expect($scope).toBeDefined();
    expect($stateParams).toBeDefined();
  });

  it("should show the message for method 'Cash'", function () {
   var payMethodName = 'Cash';
   self.onPayMethodReceived(payMethodName);
   expect(self.message).toEqual(" so come please for 15 minutes before appointment time to pay for the visit ");
   });

  it("should show the message for method 'Subscription'", function () {
    var payMethodName = 'Subscription';
    self.onPayMethodReceived(payMethodName);
    expect(self.message).toEqual(". Your subscription is active");
  });

  it("should show the payment method 'Online'", function () {
    var payMethodName = 'Online';
    self.onPayMethodReceived(payMethodName);

    expect(self.message).toEqual(" online functionality is coming soon");
  });

  it("should show the payment method 'NFZ'", function () {
    var payMethodName = 'NFZ';
    self.onPayMethodReceived(payMethodName);
    expect(self.message).toEqual(" so come please for 15 minutes before the visit time to fill the 'MFZ registry form'. " +
      " Or you can fill the 'MFZ registry form' by yourself. If you wanna to do that click on the link below");
  });

  it("should save appointment for Online payment", function () {
    spyOn(BackendService, 'send').and.returnValue($q.defer().promise);
    self.saveAppointmentAndStartTransaction();
    expect(self.loading).toBeTruthy();
    expect(self.timeout).toBeFalsy();
    expect(BackendService.send).toHaveBeenCalled();
  });

  it("should redirect to some address on success", function () {
    url = 'http://servocode.com';
    self.onStartTransactionResponse({status: 200, data: {message: url}});
    expect($window.location.href).toEqual(url);
  });

  it("should show timeout error on timeout", function () {
    self.onStartTransactionResponse({status: -1});
    expect(self.timeout).toBeTruthy();
    expect($window.location.href).toEqual('');

  });

  it("should show general error on unsuccessful try", function () {
    self.onStartTransactionResponse({status: 400});
    expect(self.error).toBeTruthy();
    expect($window.location.href).toEqual('');
  });

  it('should call translate() on event', function () {
    spyOn(self, 'translate');
    $rootScope.$broadcast('$translateChangeSuccess');
    $rootScope.$digest();
    expect(self.translate).toHaveBeenCalled();
  });

  it('should call $translate for translation', function () {
    defer.resolve({
      'user.subscriptionPaymentMethodMessage': '',
      'user.onlinePaymentMethodMessage': '',
      'user.mfzPaymentMethodMessage': '',
      'user.cashPaymentMethodMessage': ''
    });
    self.translate();
    $scope.$digest();
    expect($translate).toHaveBeenCalled();
    expect(self.cashMsg).toBeDefined();
    expect(self.subscriptionMsg).toBeDefined();
    expect(self.onlineMsg).toBeDefined();
    expect(self.mfzMsg).toBeDefined();
  });

});

