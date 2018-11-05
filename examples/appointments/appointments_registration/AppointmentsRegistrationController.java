package com.servocode.appointments.appointments_registration;

import com.servocode.core.security.annotations.SameUserOrAdminAccess;
import com.servocode.core.shared.validator.UserValidator;
import com.servocode.model.hibernate.dto.AppointmentRegistrationDto;
import com.servocode.model.hibernate.entity.AppointmentRegistration;
import com.servocode.model.hibernate.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;


@RestController
public class AppointmentsRegistrationController {

    public static final String APPOINTMENT_CONFIRM_PATH = "/api/appointment/confirmation";
    public static final String APPOINTMENT_CANCEL_PATH = "/api/appointment/cancellation";

    @Autowired
    private UserValidator validator;
    @Autowired
    private AppointmentsRegistrationService appointRegService;

    @SameUserOrAdminAccess
    @RequestMapping(path = "/api/appointments/registration/{username}", method = RequestMethod.POST)
    public ResponseEntity registerOnAppointment(@PathVariable String username,
                                                @RequestBody AppointmentRegistrationDto appDto) {
        User user = validator.getUserOrExit(username);
        AppointmentRegistration appRegistration = appointRegService
                .saveAppointmentRegistrationData(user, appDto);
        appointRegService.sendAppointmentSummaryOnEmail(appRegistration);
        return new ResponseEntity(HttpStatus.OK);
    }

    @SameUserOrAdminAccess
    @RequestMapping(path = "/api/appointments/limitation/{username}", method = RequestMethod.GET)
    public Integer getActiveAppointments(@PathVariable String username) {
        User patient = validator.getUserOrExit(username);
        return appointRegService.checkActiveAppointments(patient);
    }

    @PreAuthorize("isAuthenticated()")
    @RequestMapping(path = APPOINTMENT_CONFIRM_PATH, method = RequestMethod.GET)
    public void appointmentConfirm(@RequestParam(value = "token") String token,
                                   HttpServletResponse response) throws IOException {
        response.sendRedirect(appointRegService.confirmAndGetConfirmationPath(token));
    }

    @PreAuthorize("isAuthenticated()")
    @RequestMapping(path = APPOINTMENT_CANCEL_PATH, method = RequestMethod.GET)
    public void appointmentCancel(@RequestParam(value = "email") String email,
                                  @RequestParam(value = "token") String token,
                                  HttpServletResponse response) throws IOException {
        response.sendRedirect(appointRegService.cancelAndGetCancellationPath(email, token));
    }
}
