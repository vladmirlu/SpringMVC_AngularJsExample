package com.servocode.appointments.appointments_registration;

import java.time.LocalDateTime;

public class DateCalculator {

    public static LocalDateTime startOfDay(LocalDateTime localDateTime) {
        localDateTime = LocalDateTime.of(localDateTime.getYear(), localDateTime.getMonth(), localDateTime.getDayOfMonth(), 0, 0, 0);
        return localDateTime;
    }

    public static LocalDateTime endOfDay(LocalDateTime localDateTime) {
        localDateTime = LocalDateTime.of(localDateTime.getYear(), localDateTime.getMonth(), localDateTime.getDayOfMonth(), 23, 59, 59);
        return localDateTime;
    }
}
