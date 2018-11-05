angular
  .module('cmpPatientPortal')
  .controller('AppointmentListController', AppointmentListController);

function AppointmentListController($scope, BackendService, NgTableParams,
                                   toastr, $uibModal, $translate, $rootScope) {
  var ctrl = this;

  $scope.$watch('activeProfile.pesel', function (pesel) {
    ctrl.username = pesel;
    pesel && ctrl.tableParams.reload();
  });

  ctrl.getUrlWithPagingParams = function (username, page, size) {
    return 'api/profile/' + username + '/appointments?page=' + page + '&size=' + size;
  };

  ctrl.getAppointments = function (params) {
    if (ctrl.username) {
      var page = params ? params.page() - 1 : 0;
      var size = params ? params.count() : 10;
      var url = ctrl.getUrlWithPagingParams(ctrl.username, page, size);
      return BackendService
        .send({method: 'GET', url: url})
        .then(ctrl.onAppointmentsReceived);
    }
  };

  ctrl.tableParams = new NgTableParams({}, {
    getData: ctrl.getAppointments
  });

  ctrl.onAppointmentsReceived = function (response) {
    if (response) {
      ctrl.tableParams.total(response.data.totalElements);
      return response.data.content;
    } else ctrl.showErrorToast('Could not fetch appointments list!');
  };

  ctrl.showErrorToast = function (text) {
    var title = '';//'Failure';
    var override = {preventDuplicates: true};
    toastr.error(text, title, override);
  };

  ctrl.showAppointment = function (appointment) {
    if (appointment) {
      $uibModal.open({
        animation: true,
        ariaLabelledBy: 'Appointment details',
        ariaDescribedBy: 'Appointment details',
        templateUrl: 'app/components/patient/appointments/appointments-history/details/appointment_details.html',
        controller: 'AppointmentController',
        controllerAs: 'ctrl',
        scope: $scope,
        windowClass: "modal fade in",
        resolve: {
          appointment: appointment
        }
      });
    }
  };

  ctrl.cancel = function (appointment) {
    if (appointment) {
      var modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'Appointment cancel',
        ariaDescribedBy: 'Appointment cancellation',
        templateUrl: 'app/components/patient/appointments/appointments-history/cancel/appointment_cancel.html',
        controller: 'AppointmentCancelController',
        controllerAs: 'ctrl',
        scope: $scope,
        windowClass: "modal fade in",
        size: 'sm',
        resolve: {
          appointment: appointment
        }
      });
      modalInstance.result.then(function (appointment) {
        if (appointment) {
          var cancelUrl = 'api/profile/' + ctrl.username
            + '/appointments/' + appointment.id + '/cancel';
          BackendService.send({method: 'POST', url: cancelUrl, data: null})
            .then(ctrl.onCancelResult);
        }
      });
      return modalInstance;
    }
  };

  ctrl.onCancelResult = function (response) {
    switch (response.status) {
      case 200:
        ctrl.tableParams.reload();
        break;
      case 403:
        ctrl.showErrorToast(ctrl.cancellationDenied);
        break;
      default:
        ctrl.showErrorToast(ctrl.cancellationError);
        break;
    }
  };

  ctrl.translate = function () {
    $translate(['appointment.cancellationErrorMessage', 'appointment.cancellationImpossibleMessage'])
      .then(function (translations) {
        ctrl.cancellationError = translations['appointment.cancellationErrorMessage'];
        ctrl.cancellationDenied = translations['appointment.cancellationImpossibleMessage'];
      });
  };

  $rootScope.$on('$translateChangeSuccess', function() {ctrl.translate()});
}
