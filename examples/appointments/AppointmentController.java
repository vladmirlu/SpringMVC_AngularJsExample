package com.servocode.appointments;

import com.servocode.core.mapping.PortalModelMapper;
import com.servocode.core.mapping.dto.PageDto;
import com.servocode.core.online_payments.OnlinePaymentService;
import com.servocode.core.security.annotations.SameUserAccess;
import com.servocode.core.shared.RestResponse;
import com.servocode.core.shared.validator.UserValidator;
import com.servocode.model.hibernate.dto.AppointmentDto;
import com.servocode.model.hibernate.dto.AppointmentRegistrationDto;
import com.servocode.model.hibernate.entity.Appointment;
import com.servocode.model.hibernate.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@SameUserAccess
@RestController
public class AppointmentController {
	@Autowired private UserValidator validator;
	@Autowired private AppointmentService appService;
	@Autowired private OnlinePaymentService onlineService;
	@Autowired private PortalModelMapper mapper;

	@RequestMapping(path="/api/profile/{username}/appointments",
			method = RequestMethod.GET)
	public PageDto<AppointmentDto> getPatientAppointments(@PathVariable String username,
														  @RequestParam("page") Integer page,
														  @RequestParam("size") Integer size) {
		User user = validator.getUserOrExit(username);
		Page<Appointment> appointments = appService.getAppointments(user, page, size);
		return mapper.mapPage(appointments, AppointmentDto.class);
	}

	@RequestMapping(path="/api/profile/{username}/appointments/{id}/cancel",
			method = RequestMethod.POST)
	public ResponseEntity cancel(@PathVariable String username,
								 @PathVariable Long id) {
		User user = validator.getUserOrExit(username);
		appService.cancelAppointmentOrExit(user, id);
		return new ResponseEntity(HttpStatus.OK);
	}

	@RequestMapping(path = "/api/profile/{username}/appointments/online",
			method = RequestMethod.POST)
	public ResponseEntity<RestResponse> registerOnline(@PathVariable String username,
									   @RequestBody AppointmentRegistrationDto appDto,
									   Principal principal) {
		User user = validator.getUserOrExit(username);
		User payer = validator.getUserOrExit(principal.getName());
		return onlineService.registerTransaction(user, payer, appDto);
	}
}
