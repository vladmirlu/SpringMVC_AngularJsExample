angular
  .module('cmpPatientPortal')
  .controller('AppointmentsSchedulesController', AppointmentsSchedulesController);

function AppointmentsSchedulesController(BackendService, $state, $stateParams, $rootScope, $compile, $scope, $translate) {
  var ctrl = this;

  ctrl.url = 'api/schedules';
  ctrl.selection = $stateParams.selection;
  var payMethodsAvailableForOffer = ['Cash'];

  ctrl.isDiscountApplied = function (session, event) {
    var discountAvailable = event.discount && event.discount > 0;
    var discountCanBeApplied = session.authenticated &&
          payMethodsAvailableForOffer.indexOf(ctrl.selection.payMethod.name) != -1;
    return discountAvailable && discountCanBeApplied;
  };

  ctrl.getEvents = function (start, end, timezone, callback) {
    var request = {
      serviceOptionId:ctrl.selection.speciality.optionId,
      locationId:ctrl.selection.branch.id,
      facilityId:ctrl.selection.branch.facilityId,
      employeeId:ctrl.selection.doctor.icId,
      dateFrom: start,
      dateTo: end,
      hourFrom:'06:00',
      hourTo:'22:00',
      nfz: ctrl.selection.payMethod.name == 'NFZ'
    };
    BackendService.send({method: 'POST', url: ctrl.url, data: request})
      .then(function (response) {
        if (response.status == 200)
          angular.forEach(response.data, function (event) {
            event.start = event.startTime;
            event.end = event.endTime;
            if (ctrl.isDiscountApplied($rootScope.session, event)){
              event.color = '#ff0000';
              event.price = (event.price * (1-event.discount/100)).toFixed(2);
              event.offer = true;
            }
          });
          callback(response.data);
      });
  };

  ctrl.events =
    [{
      color: '#0000ff',
      events: ctrl.getEvents
    }];

  ctrl.onEventClick = function (event) {
    ctrl.selection.schedule = event;
    var stateName = $rootScope.session.authenticated ?
      'main.appointments-registration.appointments-registration-summary' : 'main.appointments-registration.user-information';
    $state.go(stateName, {selection: ctrl.selection});
  };

  ctrl.eventRender = function( event, element, view ) {
    if(ctrl.isDiscountApplied($rootScope.session, event)){
      element.attr({'uib-tooltip': ctrl.discountText + ': -' + event.discount + "%",
        'uib-tooltip-append-to-body': true});
      $compile(element)($scope);
    }
  };

  ctrl.uiConfig = {
    calendar:{
      height: 400,
      editable: true,
      header:{
        left: 'title',
        center: '',
        right: 'today prev,next'
      },
      timeFormat: 'HH:mm',
      displayEventEnd: true,
      firstDay: 1,
      eventClick: ctrl.onEventClick,
      eventRender: ctrl.eventRender
    }
  };

  ctrl.back = function () {
    $state.go("main.appointments-registration.appointments-payment-method", {selection: ctrl.selection});
  };

  $rootScope.$on('$translateChangeSuccess', function() {ctrl.translate()});

  ctrl.translate = function () {
    $translate(['common.discount'])
      .then(function (translations) {
        ctrl.discountText = translations['common.discount'];
      });
  };
  ctrl.translate();
  
}

