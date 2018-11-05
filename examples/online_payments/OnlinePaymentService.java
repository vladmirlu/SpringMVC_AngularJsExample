package com.servocode.core.online_payments;

import com.servocode.appointments.AppointmentStatus;
import com.servocode.appointments.appointments_registration.AppointmentsRegistrationService;
import com.servocode.core.exceptions.InterClinicAppointmentRegistrationException;
import com.servocode.core.exceptions.TransactionNotFoundException;
import com.servocode.core.shared.RestResponse;
import com.servocode.core.soap.P24SoapClient;
import com.servocode.model.hibernate.dao.AppointmentDao;
import com.servocode.model.hibernate.dao.AppointmentRegistrationDao;
import com.servocode.model.hibernate.dao.OnlineTransactionDao;
import com.servocode.model.hibernate.dao.UserDao;
import com.servocode.model.hibernate.dto.AppointmentRegistrationDto;
import com.servocode.model.hibernate.entity.*;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import pl.infomed.model.ErrorResponse;
import pl.p24.RefundTransactionResult;
import pl.p24.RegisterTransactionResult;
import pl.p24.VerifyTransactionResult;

import java.time.LocalDateTime;

import static com.servocode.model.hibernate.entity.OnlineTransactionStatus.*;

@Slf4j
@Service
public class OnlinePaymentService {
	@Value("${server.address}")
	private String backend;
	@Value("${server.port}")
	private String backendPort;
	@Value("${server.protocol}")
	private String protocol;
	@Value("${p24.backend.url}")
	private String p24BackendUrl;
	@Value("${p24.CRC}")
	private String CRC;

	@Autowired private P24SoapClient p24Client;
	@Autowired private AppointmentDao appDao;
	@Autowired private AppointmentRegistrationDao appRegDao;
	@Autowired private UserDao userDao;
	@Autowired private OnlineTransactionDao transactionDao;
	@Autowired private AppointmentsRegistrationService appRegService;

	OnlineTransaction getTransactionOrExit(Long id)
			throws TransactionNotFoundException {
		OnlineTransaction transaction = transactionDao.findOne(id);
		if (transaction == null) throw new TransactionNotFoundException();
		return transaction;
	}

	public ResponseEntity<RestResponse> registerTransaction(User user, User payer, AppointmentRegistrationDto appRegDto) {
		OnlineTransaction transaction = OnlineTransaction.builder()
				.amount(101.1).description("Test").status(NEW)
				.payer(payer).regDate(LocalDateTime.now()).build();
		transaction = transactionDao.save(transaction);
		RegisterTransactionResult result = p24Client.register(
				transaction, this.getConfirmUrl());
		if (result.getError().getErrorCode() != 0) {
			transaction.setError(result.getError().getErrorCode());
			transactionDao.save(transaction);
			log.error("RegisterTransactionResult " + transaction.getId() + ":"
					+ result.getError().getErrorMessage());
			return new ResponseEntity<>(new RestResponse(null),
					HttpStatus.BAD_REQUEST);
		}
		Appointment appointment = appRegDto.getAppointmentObject();
		appointment.setPatient(user);
		ErrorResponse response = appRegService.registerVisitAtInterClinic(appointment);
		if(response.getErrorCode() != 0){
			throw new InterClinicAppointmentRegistrationException();
		}
		appointment = appDao.save(appointment);
		AppointmentRegistration appReg = AppointmentRegistration.builder()
				.appointment(appointment)
				.status(AppointmentStatus.UNCONFIRMED)
				.appointmentRegistrationDate(LocalDateTime.now())
				.client(appointment.getPatient())
				.build();
		appReg = appRegDao.save(appReg);
		appointment.setAppointmentRegistration(appReg);
		appDao.save(appointment);
		userDao.save(appointment.getPatient());
		transaction.setAppointmentRegistration(appReg);
		transaction.setStatus(REGISTERED);
		transactionDao.save(transaction);
		return new ResponseEntity<>(new RestResponse(
				p24BackendUrl + "trnRequest/" + result.getResult()),
				HttpStatus.OK);
	}

	@NotNull
	private String getConfirmUrl() {
		return protocol + "://" + backend + ":" + backendPort
				+ OnlinePaymentController.TRANSACTION_CONFIRMATION_PATH;
	}

	boolean isTransactionValid(OnlineTransaction transaction, Integer p24_order_id, String p24_sign) {
		return p24Client.calcSign(transaction.getId().toString(), p24_order_id.toString(),
				Integer.toString((int)(transaction.getAmount()*100)), "PLN", CRC).equals(p24_sign);
	}

	void confirmTransaction(OnlineTransaction transaction) {
		transaction.setStatus(OnlineTransactionStatus.CONFIRMED);
		AppointmentRegistration appReg = transaction.getAppointmentRegistration();
		appReg.setStatus(AppointmentStatus.CONFIRMED);
		transactionDao.save(transaction);
		appRegDao.save(appReg);
		appRegService.sendAppointmentSummaryOnEmail(appReg);
	}

	void verifyTransaction(OnlineTransaction transaction) {
		VerifyTransactionResult result = p24Client.verify(transaction);
		int error = result.getError().getErrorCode();
		if(error != 0) {
			transaction.setError(error);
			log.error("VerifyTransactionResult " + transaction.getId() + ":"
					+ result.getError().getErrorMessage());
		}
		else {
			transaction.setStatus(OnlineTransactionStatus.VERIFIED);
		}
		transactionDao.save(transaction);
	}

	public void refundTransaction(AppointmentRegistration registration) {
		OnlineTransaction transaction = transactionDao.findByAppointmentRegistration(registration);
		if (transaction == null) {
			log.error("Could not find transaction for registration " + registration.getId());
			return;
		}
		RefundTransactionResult result  = p24Client.refund(transaction);
		int error = result.getError().getErrorCode();
		if(error != 0) {
			transaction.setError(error);
			log.error("TrnRefundResult " + transaction.getId() + ":"
					+ result.getError().getErrorMessage());
		}
		else {
			transaction.setStatus(OnlineTransactionStatus.REFUNDED);
		}
		transactionDao.save(transaction);
	}
}
