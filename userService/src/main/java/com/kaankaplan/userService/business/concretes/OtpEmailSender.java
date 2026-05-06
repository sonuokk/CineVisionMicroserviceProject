package com.kaankaplan.userService.business.concretes;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpEmailSender {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.sender:no-reply@cinesaga.local}")
    private String sender;

    public void sendOtp(String recipient, String purpose, String otp) {
        if (!StringUtils.hasText(mailUsername)) {
            log.warn("Mail credentials are not configured. {} OTP for {} is {}", purpose, recipient, otp);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(StringUtils.hasText(sender) ? sender : mailUsername);
        message.setTo(recipient);
        message.setSubject("CineSaga " + purpose + " OTP");
        message.setText("Your CineSaga " + purpose.toLowerCase() + " OTP is " + otp
                + ". It expires soon. Do not share this code with anyone.");

        javaMailSender.send(message);
    }
}
