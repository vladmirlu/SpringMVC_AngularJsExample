package com.servocode.appointments;

import com.servocode.appointments.appointments_registration.AppointmentsRegistrationService;
import com.servocode.core.exceptions.AppointmentCancellationException;
import com.servocode.core.exceptions.AppointmentNotFoundException;
import com.servocode.core.exceptions.UserNotFoundException;
import com.servocode.core.interclinic.IcRestClient;
import com.servocode.core.online_payments.OnlinePaymentService;
import com.servocode.model.hibernate.dao.AppointmentDao;
import com.servocode.model.hibernate.dao.AppointmentRegistrationDao;
import com.servocode.model.hibernate.entity.Appointment;
import com.servocode.model.hibernate.entity.AppointmentRegistration;
import com.servocode.model.hibernate.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import pl.infomed.model.Patient;
import pl.infomed.model.Visit;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
public class AppointmentService {

    public static final long HOURS_PRIOR_CANCELLATION = 24L;

    @Autowired
    private AppointmentDao appDao;
    @Autowired
    private AppointmentRegistrationDao appRegDao;
    @Autowired
    private OnlinePaymentService onlineService;
    @Autowired
    private AppointmentsRegistrationService appointmentService;
    @Autowired
    private IcRestClient icRestClient;

    Page<Appointment> getAppointments(User user, Integer page, Integer size) {
        PageRequest pageRequest = new PageRequest(page, size);
        return appDao.getAppointments(user, pageRequest);
    }

    void cancelAppointmentOrExit(User user, Long appId) throws AppointmentNotFoundException {
        Appointment appointment = appDao.find(user, appId, AppointmentStatus.CONFIRMED);
        if (appointment == null) {
            throw new AppointmentNotFoundException();
        }
        if (!isAppointmentEligibleForCancellation(appointment)) {
            throw new AppointmentCancellationException();
        }
        AppointmentRegistration registration = appointment.getAppointmentRegistration();
        HttpStatus cancelStatus = cancelVisitAtInterClinic(appointment);
        if(cancelStatus.equals(HttpStatus.OK)) {
            registration.setStatus(AppointmentStatus.CANCELED);
            appRegDao.save(registration);
            appointmentService.sendCancellationAppointmentEmails(user, appointment);
            if (appointment.getPayMethod().getName().equals("Online")) {
                onlineService.refundTransaction(registration);
            }
        }
    }

    boolean isAppointmentEligibleForCancellation(Appointment appointment) {
        return LocalDateTime.now().until(appointment.getAppointmentDate(), ChronoUnit.HOURS) >= HOURS_PRIOR_CANCELLATION
                && appointment.getDiscount() == 0;
    }

    HttpStatus cancelVisitAtInterClinic(Appointment appointment) {
        User user = appointment.getPatient();
        Patient patient = Patient.builder()
                .name(user.getFirstName())
                .surname(user.getLastName())
                .pesel(user.getPesel())
                .build();
        Integer patientId = icRestClient.getPatientId(patient);
        if (patientId == null) {
            throw new UserNotFoundException();
        }
        List<Visit> visits = icRestClient.getScheduledVisits(patientId);
        if (!visits.isEmpty()) {
            for(Visit visit : visits){
                if(visit.getDate().equals(appointment.getAppointmentDate().toLocalDate())
                   && visit.getTime().equals(appointment.getAppointmentDate().toLocalTime())){
                    appointment.setInterClinicVisitId(visit.getId());
                    return icRestClient.cancelVisit(visit.getId());
                }
            }
        }
       throw new AppointmentNotFoundException();
    }
}
