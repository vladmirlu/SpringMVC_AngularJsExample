package com.servocode.core.interclinic;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.support.BasicAuthorizationInterceptor;
import org.springframework.web.client.RestTemplate;

@Configuration
public class IcRestConfiguration {
	@Value("${ic.api.login}")
	private String login;
	@Value("${ic.api.password}")
	private String password;

	@Bean
	public RestTemplate restTemplate(RestTemplateBuilder builder) {
		RestTemplate restTemplate = builder.build();
		restTemplate.getInterceptors().add(new BasicAuthorizationInterceptor(login, password));
		return restTemplate;
	}

}
