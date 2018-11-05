package com.servocode.core.online_payments;


import com.servocode.model.hibernate.entity.OnlineTransaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Slf4j
@Controller
public class OnlinePaymentController {
	public static final String TRANSACTION_CONFIRMATION_PATH = "/api/p24_status";
	@Autowired private OnlinePaymentService service;

	@RequestMapping(path = TRANSACTION_CONFIRMATION_PATH, method = RequestMethod.POST)
	public ResponseEntity confirm(Long p24_session_id,
								  Integer p24_order_id,
								  Integer p24_method,
								  String p24_statement,
								  String p24_sign) {
		OnlineTransaction transaction = service.getTransactionOrExit(p24_session_id);
		if (!service.isTransactionValid(transaction, p24_order_id, p24_sign)) {
			log.error("Invalid checksum for transaction " + p24_session_id);
			return new ResponseEntity(HttpStatus.BAD_REQUEST);
		}
		transaction.setOrderId(p24_order_id);
		transaction.setPayMethod(p24_method);
		transaction.setStatement(p24_statement);
		service.confirmTransaction(transaction);
		service.verifyTransaction(transaction);
		return new ResponseEntity(HttpStatus.OK);
	}
}
