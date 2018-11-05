package com.servocode.appointments.appointments_registration;

import com.servocode.appointments.AppointmentService;
import com.servocode.appointments.AppointmentStatus;
import com.servocode.core.email.strategies.EmailType;
import com.servocode.core.exceptions.InterClinicAppointmentRegistrationException;
import com.servocode.core.exceptions.InvalidPaymentException;
import com.servocode.core.exceptions.PaymentMethodNotFoundException;
import com.servocode.core.interclinic.IcRestClient;
import com.servocode.model.hibernate.dao.*;
import com.servocode.model.hibernate.dto.AppointmentRegistrationDto;
import com.servocode.model.hibernate.entity.*;
import com.servocode.schedules.SchedulesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.infomed.model.ErrorResponse;
import pl.infomed.model.Patient;
import pl.infomed.model.ScheduleRequest;
import pl.infomed.model.VisitRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AppointmentsRegistrationService {

    private static String[] PAYMENT_METHODS_ELIGIBLE_FOR_OFFERS = {"CASH"};

    @Autowired
    private ScheduledEmailDao scheduledEmailDao;
    @Autowired
    private UserDao userDao;
    @Autowired
    private AppointmentDao appointmentDao;
    @Autowired
    private AppointmentRegistrationDao appointmentRegistrationDao;
    @Autowired
    private IcRestClient icRestClient;
    @Autowired
    private SchedulesService schedulesService;
    @Autowired
    private AppointmentsSMSSender smsSender;
    @Autowired
    private PaymentDao paymentDao;

    @Value("${frontend.address}")
    private String frontendHost;
    @Value("${frontend.port}")
    private String frontendPort;
    @Value("${server.protocol}")
    private String protocol;


    public void sendAppointmentSummaryOnEmail(AppointmentRegistration appRegistration) {
        User patient = appRegistration.getAppointment().getPatient();
        if (patient.getEmail() != null) {
            ScheduledEmail scheduledEmail = ScheduledEmail.builder()
                    .email(patient.getEmail())
                    .type(EmailType.APPOINTMENT_REGISTRATION)
                    .appointment(appRegistration.getAppointment())
                    .additionalData(appRegistration.getConfirmToken())
                    .additionalData2(appRegistration.getCancelToken())
                    .build();
            scheduledEmailDao.save(scheduledEmail);
        }
        if (appRegistration.getAppointment().getDiscount() > 0
                && patient.getPhone()!= null) {
            smsSender.sendSmsOnOfferRegistration(appRegistration);
        }
    }

    @Transactional
    public AppointmentRegistration saveAppointmentRegistrationData(User realUser, AppointmentRegistrationDto appDto){
        Appointment appointment = appDto.getAppointmentObject();
        appointment.setPatient(realUser);
        validatePaymentMethod(appointment);
        calculateAppointmentPrice(appDto, appointment);
        ErrorResponse response = registerVisitAtInterClinic(appointment);
        if(response.getErrorCode() != 0){
            throw new InterClinicAppointmentRegistrationException(response.getDescription());
        }
        String confirmationToken = UUID.randomUUID().toString();
        String cancellationToken = UUID.randomUUID().toString();
        AppointmentRegistration appointRegistration = AppointmentRegistration.builder()
                .appointmentRegistrationDate(LocalDateTime.now())
                .status(AppointmentStatus.UNCONFIRMED)
                .confirmToken(confirmationToken)
                .cancelToken(cancellationToken)
                .appointment(appointment)
                .client(realUser).build();
        appointment.setAppointmentRegistration(appointRegistration);
        appointmentDao.save(appointment);
        appointmentRegistrationDao.save(appointRegistration);
        return appointRegistration;
    }

    void validatePaymentMethod(Appointment appointment) {
        PaymentMethod existedPayMethod = paymentDao.findByName(appointment.getPayMethod().getName());
        if(existedPayMethod == null)
            throw new PaymentMethodNotFoundException();
        if(isPaymentMethodNotAllowed(appointment))
            throw new InvalidPaymentException();
    }

    boolean isPaymentMethodNotAllowed(Appointment appointment) {
        return (appointment.getPayMethod().getName().toUpperCase().equals("NFZ")
                && !appointment.getPatient().isNfzConfirmed())
                || (appointment.getPayMethod().getName().toUpperCase().equals("SUBSCRIPTION")
                && !appointment.getPatient().isPayerConfirmed());
    }

    void calculateAppointmentPrice(AppointmentRegistrationDto appDto, Appointment appointment) {
        Schedule schedule = findSchedule(appDto);
        double price = Double.parseDouble(schedule.getPrice());
        if (appointment.getPatient().isEnabled()) {
            boolean discountAvailable = schedule.getDiscount() != null && schedule.getDiscount() > 0;
            boolean discountApplicable = Arrays.asList(PAYMENT_METHODS_ELIGIBLE_FOR_OFFERS)
                    .contains(appointment.getPayMethod().getName().toUpperCase());
            if(discountAvailable && discountApplicable){
                Double reduceRate = (1 - (double)schedule.getDiscount()/100);
                price *= reduceRate;
                appointment.setDiscount(schedule.getDiscount());
            }
        }
        appointment.setPrice(new BigDecimal(price).setScale(2, BigDecimal.ROUND_HALF_EVEN));
    }

    private Schedule findSchedule(AppointmentRegistrationDto appDto){
        ScheduleRequest scheduleRequest = ScheduleRequest.builder()
                .locationId(appDto.getBranch().getId().intValue())
                .facilityId(appDto.getBranch().getFacilityId())
                .serviceOptionId(appDto.getSpeciality().getOptionId())
                .employeeId(appDto.getDoctor().getIcId())
                .dateFrom(appDto.getSchedule().getStartTime().toLocalDate())
                .dateTo(appDto.getSchedule().getEndTime().toLocalDate())
                .hourFrom(appDto.getSchedule().getStartTime().toLocalTime())
                .hourTo(appDto.getSchedule().getEndTime().toLocalTime())
                .nfz(appDto.getPayMethod().getName().equals("NFZ"))
                .build();

        List<Schedule> schedules = schedulesService.getSchedules(scheduleRequest);
        schedules = schedules.stream().filter(schedule -> {
            return (schedule.getEmployeeId() == appDto.getDoctor().getIcId()) &&
                    schedule.getStartTime().isEqual(appDto.getSchedule().getStartTime()) &&
                    schedule.getEndTime().isEqual(appDto.getSchedule().getEndTime());
        }).collect(Collectors.toList());
        if(schedules.size() != 1)
            throw new InterClinicAppointmentRegistrationException("Error! Cannot find such schedule");
        return schedules.get(0);
    }

    public void sendCancellationAppointmentEmails(User user, Appointment appointment) {
        ScheduledEmail scheduledEmail = ScheduledEmail.builder()
                .email(user.getEmail()).type(EmailType.APPOINTMENT_CANCELLATION)
                .appointment(appointment).build();
        scheduledEmailDao.save(scheduledEmail);
    }

     String confirmAndGetConfirmationPath(String token) {
        AppointmentRegistration appointmentRegistration = appointmentRegistrationDao.findByConfirmToken(token);
        if (appointmentRegistration != null && appointmentRegistration.getStatus().equals(AppointmentStatus.UNCONFIRMED)) {
            appointmentRegistration.setStatus(AppointmentStatus.CONFIRMED);
            appointmentRegistrationDao.save(appointmentRegistration);
            return  protocol + "://" + frontendHost + ":" + frontendPort
                    + "/#/appointment-confirmation-success";
        }
        return  protocol + "://" + frontendHost + ":" + frontendPort
                + "/#/appointment-confirmation-error";
    }

    public ErrorResponse registerVisitAtInterClinic(Appointment appointment){
        User user = appointment.getPatient();
        Patient patient = Patient.builder()
                .name(user.getFirstName())
                .surname(user.getLastName())
                .pesel(user.getPesel())
                .build();
        Integer patientId = icRestClient.getPatientId(patient);
        if(patientId == null)
            return ErrorResponse.builder().errorCode(-15).description("Error! Cannot find or register a user.").build();
        VisitRequest vr = VisitRequest.builder()
                .personId(patientId)
                .optionIds(new Integer[]{appointment.getOptionId()})
                .employeeId(appointment.getDoctor().getIcId())
                .roomId(appointment.getRoomId())
                .date(appointment.getAppointmentDate().toLocalDate())
                .time(appointment.getAppointmentDate().toLocalTime())
                .nfz(appointment.getPayMethod().getName().equals("NFZ"))
                .build();
        return icRestClient.bookVisit(vr);
    }

    String cancelAndGetCancellationPath(String email, String token) {
        AppointmentRegistration appointmentRegistration = appointmentRegistrationDao.findByCancelToken(token);
        User user = userDao.findByEmail(email);
        Appointment appointment = appointmentDao.findByAppointmentRegistration(appointmentRegistration);
        if(appointmentRegistration != null) {
            AppointmentStatus status = appointmentRegistration.getStatus();
            if (status.equals(AppointmentStatus.UNCONFIRMED) || status.equals(AppointmentStatus.CONFIRMED)) {
                if(status.equals(AppointmentStatus.CONFIRMED)){
                    LocalDateTime appointmentDate = appointmentRegistration.getAppointment().getAppointmentDate();
                    if(LocalDateTime.now().until(appointmentDate, ChronoUnit.HOURS) < AppointmentService.HOURS_PRIOR_CANCELLATION){
                        return  protocol + "://" + frontendHost + ":" + frontendPort
                                + "/#/appointment-cancellation-denial";
                    }
                }
                appointmentRegistration.setStatus(AppointmentStatus.CANCELED);
                appointmentRegistrationDao.save(appointmentRegistration);
                sendCancellationAppointmentEmails(user, appointment);
                return  protocol + "://" + frontendHost + ":" + frontendPort
                        + "/#/appointment-cancellation-success";
            }
        }
        return  protocol + "://" + frontendHost + ":" + frontendPort
                + "/#/appointment-cancellation-error";
    }

        Integer checkActiveAppointments(User patient) {
        List<Appointment> activeAppointments = appointmentDao.findAllActive(patient, LocalDateTime.now());
        if (patient.isPayerConfirmed()) {
            if (activeAppointments.size() < 5)
                return 5 - activeAppointments.size();
        } else {
            if (activeAppointments.size() == 0)
                return 1;
        }
        return 0;
    }
}
