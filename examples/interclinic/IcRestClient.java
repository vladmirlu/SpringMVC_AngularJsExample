package com.servocode.core.interclinic;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servocode.model.hibernate.entity.Schedule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import pl.infomed.model.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class IcRestClient {
	private static final String SERVICES_URL = "services";
	private static final String LOCATIONS_URL = "locations";
	private static final String EMPLOYEES_URL = "employees";
	private static final String DATES_URL = "schedules";
	private static final String NEXT_SCHEDULE_URL = "schedules/next";
	private static final String BOOK_VISIT = "schedules/visit";
	private static final String SCHEDULED_VISITS_URL = "patients/{id}/visits/scheduled";
	private static final String CANCEL_VISIT_URL = "schedules/visit/{id}";
	private static final String PATIENTS = "patients";
	private static final String GET_LAB_DATA_URL = "patients/{id}/medical_research";
	private static final String DOWNLOAD_LAB_DATA_URL = "medical_research/{docId}/download";

	@Value("${ic.api.url}")
	private String backendUrl;

	@Autowired private RestTemplate rest;

	public List<Service> getServices() {
		ResponseEntity<Service[]> response = rest.getForEntity(backendUrl + SERVICES_URL, Service[].class);
		if (response.getStatusCode() == HttpStatus.OK)
			return Arrays.asList(response.getBody());
		else return new ArrayList<>();
	}

	public List<Location> getLocations(Integer[] serviceOptionIds) {
		if (serviceOptionIds != null && serviceOptionIds.length != 0) {
			ResponseEntity<Location[]> response = rest.postForEntity(backendUrl + LOCATIONS_URL,
					new ServiceLocationRequest(serviceOptionIds, 0), Location[].class);
			if (response.getStatusCode() == HttpStatus.OK)
				return Arrays.asList(response.getBody());
		}
		return new ArrayList<>();
	}

	public List<Employee> getEmployees(EmployeeRequest employeeRequest){
		if(employeeRequest != null) {
			ResponseEntity<Employee[]> response = rest.postForEntity(backendUrl + EMPLOYEES_URL, employeeRequest, Employee[].class);
			if (response.getStatusCode() == HttpStatus.OK)
				return Arrays.asList(response.getBody());
		}
		return Collections.emptyList();
	}

	public List<Schedule> getSchedules(ScheduleRequest request){
		if(request != null) {
			ResponseEntity<Schedule[]> dates = rest.postForEntity(
					backendUrl + DATES_URL, request, Schedule[].class);
			if (dates.getStatusCode() == HttpStatus.OK)
				return Arrays.asList(dates.getBody());
		}
		return new ArrayList<>();
	}

	public List<Visit> getScheduledVisits(int id){
			ResponseEntity<Visit[]> visits = rest.getForEntity(
					backendUrl + SCHEDULED_VISITS_URL.replace("{id}", Integer.toString(id)), Visit[].class);
			if (visits.getStatusCode() == HttpStatus.OK) {
				return Arrays.asList(visits.getBody());
			}
		return new ArrayList<>();
	}

	public List<Document> getLabDataDocuments(int patientId){
		ResponseEntity<Document[]> documents = rest.getForEntity(
				backendUrl + GET_LAB_DATA_URL.replace("{id}", Integer.toString(patientId)), Document[].class);
		if (documents.getStatusCode() == HttpStatus.OK) {
			return Arrays.asList(documents.getBody());
		}
		return new ArrayList<>();
	}

	public HttpStatus   downloadLabDataStatus(Integer docId) {
		HttpStatus status = null;
		ResponseExtractor<HttpStatus> responseExtractor =  clientHttpResponse -> clientHttpResponse.getStatusCode();
		try {
			status = rest.execute(backendUrl + DOWNLOAD_LAB_DATA_URL.replace("{docId}", Integer.toString(docId)),
					HttpMethod.GET, null, responseExtractor, HttpStatus.class);
		}
		catch (HttpClientErrorException ce) {
			log.error("Cannot parse response object: " + ce.getResponseBodyAsString());
		}
		return  status;
	}

	public ErrorResponse bookVisit(VisitRequest visitRequest){
		ErrorResponse errorResponse = new ErrorResponse(-16, "Error! Cannot book a visit");
		try {
			errorResponse = rest.postForObject(backendUrl + BOOK_VISIT, visitRequest, ErrorResponse.class);
		}
		catch (HttpClientErrorException ce){
			try {
				errorResponse = new ObjectMapper().readValue(ce.getResponseBodyAsString(), ErrorResponse.class);
			}
			catch (IOException e) {
				log.error("Cannot parse response object: " + ce.getResponseBodyAsString());
				throw new RuntimeException(e.getCause());
			}
		}
		catch (RestClientException e){}
		return  errorResponse;
	}

	public HttpStatus cancelVisit(Integer id){
		HttpStatus status = null;
		ResponseExtractor<HttpStatus> responseExtractor =  clientHttpResponse -> clientHttpResponse.getStatusCode();
		try {
			status = rest.execute(backendUrl + CANCEL_VISIT_URL.replace("{id}", Integer.toString(id)),
					HttpMethod.DELETE, null, responseExtractor, HttpStatus.class);
		}
		catch (HttpClientErrorException ce) {
				log.error("Cannot parse response object: " + ce.getResponseBodyAsString());
		}
		return  status;
	}

	public Integer getPatientId(Patient patient){
		Integer id = null;
		try {
			id = rest.postForObject(backendUrl + PATIENTS, patient, Integer.class);
		}
		catch (RestClientException e){
			log.error("Error occurred on user search PESEL: " + patient.getPesel() +
												", NAME: " + patient.getName() + " " + patient.getSurname());
		}
		return id;
	}
}
