package com.servocode.appointments.appointments_registration;

import com.servocode.core.exceptions.SmsSendingException;
import com.servocode.core.shared.RestResponse;
import com.servocode.core.sms.SmsApiSender;
import com.servocode.model.hibernate.dao.AppointmentDao;
import com.servocode.model.hibernate.dao.UserDao;
import com.servocode.model.hibernate.entity.Appointment;
import com.servocode.model.hibernate.entity.AppointmentRegistration;
import com.servocode.model.hibernate.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AppointmentsSMSSender {

    @Autowired
    private UserDao userDao;
    @Autowired
    private AppointmentDao appointmentDao;
    @Autowired
    private SmsApiSender smsSender;

    public void activateSendindReminderSMSToPatientsOnAppointment() {
        sendReminderSMSToPatientOneDayBeforeAppointment(getUsersIdsOnTomorrowsAppointments());
    }

    void sendReminderSMSToPatientOneDayBeforeAppointment(Map<Long, Appointment> userIdAppointmentMap) {
        String source = "CMP_Portal";
        String phone;
        String message;
        Iterable<User> usersOnAppointments = userDao.findAll(userIdAppointmentMap.keySet());
        for (User user : usersOnAppointments) {
            phone = user.getPhone();
            Appointment appointment = userIdAppointmentMap.get(user.getId());
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
            String appointmentTime = appointment.getAppointmentDate().format(formatter);
            message = "CMP Patient Portal: Hello, dear " + user.getFirstName() + " " + user.getLastName()
                    + ". We remind that your appointment" + " will be tomorrow "
                    + appointment.getAppointmentDate().toLocalDate() + " at " + appointmentTime
                    + " on the address: " + appointment.getBranch().getCity() + ", " + appointment.getBranch().getAddress()
                    + ". Your payment method is: " + appointment.getPayMethod().getName()
                    + " Price: " + appointment.getPrice() + " euro."
                    + " Best regards CMP Patient Portal";

            if (user.getPhone() != null && !user.getPhone().equals("")) {
                ResponseEntity<RestResponse> response = smsSender.sendSMS(source, phone, message);
                if (response == null || response.getStatusCode() != HttpStatus.OK) {
                    throw new SmsSendingException();
                }
                log.info("Sent SMS to " + user.getFirstName() + " " + user.getLastName() + " scheduled on appointment user");
            }
        }
        log.info("Sent SMS to " + userIdAppointmentMap.size() + " scheduled on appointments users");
    }

    void sendSmsOnOfferRegistration(AppointmentRegistration appointReg) {
        String source = "CMP_Portal";
        String phone;
        String message;
        User user = appointReg.getClient();
        phone = user.getPhone();
        Appointment appointment = appointReg.getAppointment();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        String appointmentTime = appointment.getAppointmentDate().format(formatter);
        message = "CMP Patient Portal: Hello, dear " + user.getFirstName() + " " + user.getLastName() +
                ". We remind that you have registered on special offer which"
                + " will be " + appointment.getAppointmentDate().toLocalDate() + " at " + appointmentTime
                + " Address: " + appointment.getBranch().getCity() + ", " + appointment.getBranch().getAddress()
                + ". Your payment method is: " + appointment.getPayMethod().getName()
                + ". Offer discount = " + appointment.getDiscount() + " %."
                + " Offer price with discount: " + appointment.getPrice() + " euro."
                + " Best regards CMP Patient Portal";

        if (user.getPhone() != null && !user.getPhone().equals("")) {
            ResponseEntity<RestResponse> response = smsSender.sendSMS(source, phone, message);
            if (response == null || response.getStatusCode() != HttpStatus.OK) {
                log.info("Error! Could not send SMS to " + user.getFirstName() + " " + user.getLastName() + " scheduled on offer user");
            } else {
                log.info("Sent SMS to " + user.getFirstName() + " " + user.getLastName() + " scheduled on offer user");
            }
        }
    }

    public void sendSmsForQuickRegistration(Appointment appointment) {
        String source = "CMP_Portal";
        String phone;
        String message;

        User user = appointment.getPatient();
        phone = user.getPhone();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        String dateOnAppointment = appointment.getAppointmentDate().format(formatter);
        message = "Dear " + user.getFirstName() + " " + user.getLastName() +
                "! You have successfully registered for a visit. Date: "
                + appointment.getAppointmentDate().toLocalDate() + ", " + dateOnAppointment
                + ", address: " + appointment.getBranch().getCity() + ", " + appointment.getBranch().getAddress() +
                ". Please come to Reception in 15 minutes before visit." + " Best regards, CMP Patient Portal";

        if (user.getPhone() != null && !user.getPhone().equals("")) {
            ResponseEntity<RestResponse> response = smsSender.sendSMS(source, phone, message);
            if (response == null || response.getStatusCode() != HttpStatus.OK) {
                throw new SmsSendingException();
            }
            log.info("Sent SMS to " + user.getFirstName() + " " + user.getLastName() + " about quick registration");
        }
    }

    Map<Long, Appointment> getUsersIdsOnTomorrowsAppointments() {
        LocalDateTime minDate = DateCalculator.startOfDay(LocalDateTime.now().plusDays(1));
        LocalDateTime maxDate = DateCalculator.endOfDay(LocalDateTime.now().plusDays(1));
        List<Appointment> tomorrowsAppointments = appointmentDao.scheduledAppointments(minDate, maxDate);
        Map<Long, Appointment> userIdAppointmentMap = new HashMap<>();
        for (Appointment appointment : tomorrowsAppointments) {
            userIdAppointmentMap.put(appointment.getPatient().getId(), appointment);
        }
        return userIdAppointmentMap;
    }
}
