package com.doffeii.userService.business.concretes;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpEmailSender {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.sender:}")
    private String sender;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public void sendOtp(String recipient, String purpose, String otp, long expiryMinutes) {
        if (!StringUtils.hasText(mailUsername)) {
            log.warn("Mail username is not configured. {} OTP for {} was not sent.", purpose, recipient);
            throw new IllegalStateException("Mail username is not configured. Set MAIL_USERNAME in .env or in this PowerShell window.");
        }

        if (!StringUtils.hasText(mailPassword)) {
            log.warn("Mail password is not configured. {} OTP for {} was not sent.", purpose, recipient);
            throw new IllegalStateException("Mail password is not configured. Set MAIL_PASSWORD in .env or in this PowerShell window.");
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(StringUtils.hasText(sender) ? sender : mailUsername);
            helper.setTo(recipient);
            helper.setSubject("Your CineSaga verification code");
            helper.setText(buildPlainTextMessage(purpose, otp, expiryMinutes), buildHtmlMessage(purpose, otp, expiryMinutes));
            javaMailSender.send(message);
        } catch (MessagingException | MailException exception) {
            log.warn("Failed to send {} OTP to {}", purpose, recipient, exception);
            throw new IllegalStateException("Could not send OTP email. Check SMTP credentials and try again.");
        }
    }

    private String buildPlainTextMessage(String purpose, String otp, long expiryMinutes) {
        return "Your CineSaga " + purpose.toLowerCase() + " verification code is " + otp
                + ". It expires in " + expiryMinutes + " minutes. Do not share this code with anyone.";
    }

    private String buildHtmlMessage(String purpose, String otp, long expiryMinutes) {
        String safePurpose = escapeHtml(purpose.toLowerCase());
        return """
                <!doctype html>
                <html>
                <body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
                    <div style="background:#111827;border-radius:8px 8px 0 0;padding:22px 28px;color:#ffffff;">
                      <div style="font-size:22px;font-weight:700;letter-spacing:0;">CineSaga</div>
                    </div>
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:28px;">
                      <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;">Verify your email</h1>
                      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#4b5563;">
                        Use this code to complete your CineSaga %s. The code expires in %d minutes.
                      </p>
                      <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;background:#f3f4f6;border-radius:8px;padding:18px 12px;margin:24px 0;color:#111827;">
                        %s
                      </div>
                      <p style="font-size:14px;line-height:1.6;margin:0;color:#6b7280;">
                        If you did not request this code, you can safely ignore this email. Never share this code with anyone.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(safePurpose, expiryMinutes, escapeHtml(otp));
    }

    private String escapeHtml(String value) {
        return value == null ? "" : value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
