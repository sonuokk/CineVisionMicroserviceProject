package com.doffeii.movieService.business.concretes;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.doffeii.movieService.entity.TicketBooking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TicketEmailSender {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.sender:}")
    private String sender;

    public void sendBookingTicket(TicketBooking booking, String chairNumbers, BigDecimal totalAmount, String qrCodePayload) {
        if (!StringUtils.hasText(mailUsername) || !StringUtils.hasText(mailPassword)) {
            throw new IllegalStateException("SMTP credentials are missing. Set MAIL_USERNAME and MAIL_PASSWORD in .env.");
        }

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            byte[] ticketImage = buildTicketImage(booking, chairNumbers, totalAmount, qrCodePayload);
            byte[] ticketQrImage = buildQrCodeImage(qrCodePayload, 240);
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(StringUtils.hasText(sender) ? sender : mailUsername);
            helper.setTo(booking.getEmail());
            helper.setSubject("CineSaga ticket confirmed - " + booking.getMovieName());
            helper.setText(buildTicketHtml(booking, chairNumbers, totalAmount, qrCodePayload), true);
            helper.addInline("ticketPreview", new ByteArrayResource(ticketImage), "image/png");
            helper.addInline("ticketQr", new ByteArrayResource(ticketQrImage), "image/png");
            helper.addAttachment(booking.getBookingCode() + ".png", new ByteArrayResource(ticketImage), "image/png");
            javaMailSender.send(mimeMessage);
        } catch (MessagingException | MailException | IOException | WriterException exception) {
            throw new IllegalStateException("Could not send booking confirmation email. Check SMTP settings.", exception);
        }
    }

    private String buildTicketHtml(TicketBooking booking, String chairNumbers, BigDecimal totalAmount, String qrCodePayload) {
        return """
                <!doctype html>
                <html>
                <body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1d1d1f;">
                  <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
                    <div style="background:#ffffff;border:1px solid #e5e5ea;border-radius:28px;padding:28px;box-shadow:0 24px 70px rgba(0,0,0,.08);">
                      <p style="margin:0 0 8px;color:#0071e3;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">CineSaga Ticket</p>
                      <h1 style="margin:0 0 18px;font-size:30px;letter-spacing:-.04em;">Your ticket is booked</h1>
                      <p style="margin:0 0 24px;color:#6e6e73;line-height:1.55;">Hi %s, your booking is confirmed. Please show this ticket code at the theater.</p>
                      <div style="background:#f5f5f7;border-radius:20px;padding:18px;margin-bottom:18px;">
                        <div style="font-size:12px;color:#6e6e73;text-transform:uppercase;letter-spacing:.12em;">Ticket ID</div>
                        <div style="font-size:32px;font-weight:900;letter-spacing:.04em;color:#050505;word-break:break-word;">%s</div>
                      </div>
                      %s
                      <div style="margin:18px 0;padding:16px;border-radius:18px;border:1px solid #d9e4f2;background:#fbfdff;">
                        <div style="display:flex;gap:16px;align-items:center;">
                          <img src="cid:ticketQr" alt="Scannable CineSaga ticket QR code" style="width:132px;height:132px;border:8px solid #ffffff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.10);" />
                          <div>
                            <div style="font-size:14px;font-weight:800;color:#1d1d1f;margin-bottom:6px;">Scannable Ticket QR</div>
                            <div style="font-size:13px;line-height:1.5;color:#6e6e73;">The QR contains the same ticket ID, movie, theatre, date, time, and seat details as the downloaded ticket.</div>
                          </div>
                        </div>
                      </div>
                      <div style="margin:20px 0 0;">
                        <p style="margin:0 0 10px;color:#1d1d1f;font-weight:700;">Downloadable ticket</p>
                        <p style="margin:0 0 12px;color:#6e6e73;font-size:13px;line-height:1.45;">A PNG ticket is attached to this email. Open or download the attachment named <strong>%s.png</strong>.</p>
                        <img src="cid:ticketPreview" alt="CineSaga ticket preview" style="display:block;width:100%%;max-width:584px;border-radius:18px;border:1px solid #e5e5ea;" />
                      </div>
                      <div style="margin-top:18px;padding:16px;border-radius:18px;border:1px dashed #b8c7dc;background:#fbfdff;">
                        <div style="font-size:12px;color:#6e6e73;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;">QR Payload</div>
                        <div style="font-size:13px;line-height:1.5;color:#1d1d1f;word-break:break-word;">%s</div>
                      </div>
                      <p style="margin:22px 0 0;color:#6e6e73;font-size:13px;">Enjoy the show from everyone at CineSaga.</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                escapeHtml(booking.getFullName()),
                escapeHtml(booking.getBookingCode()),
                ticketRows(booking, chairNumbers, totalAmount),
                escapeHtml(booking.getBookingCode()),
                escapeHtml(qrCodePayload)
        );
    }

    private String ticketRows(TicketBooking booking, String chairNumbers, BigDecimal totalAmount) {
        return """
                <table style="width:100%%;border-collapse:collapse;font-size:15px;">
                  %s
                  %s
                  %s
                  %s
                  %s
                  %s
                </table>
                """.formatted(
                row("Movie", booking.getMovieName()),
                row("Theater", booking.getSaloonName()),
                row("Date", booking.getMovieDay()),
                row("Showtime", booking.getMovieStartTime()),
                row("Seats", chairNumbers),
                row("Amount", "INR " + totalAmount.toPlainString())
        );
    }

    private String row(String label, String value) {
        return """
                <tr>
                  <td style="padding:10px 0;color:#6e6e73;border-bottom:1px solid #f0f0f2;">%s</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f2;">%s</td>
                </tr>
                """.formatted(escapeHtml(label), escapeHtml(value));
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private byte[] buildTicketImage(TicketBooking booking, String chairNumbers, BigDecimal totalAmount, String qrCodePayload) throws IOException {
        BufferedImage image = new BufferedImage(1400, 720, BufferedImage.TYPE_INT_ARGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        graphics.setColor(new Color(11, 11, 13));
        graphics.fillRect(0, 0, 1400, 720);
        graphics.setColor(new Color(255, 255, 255, 20));
        graphics.fill(new Ellipse2D.Double(910, -120, 440, 440));
        graphics.fill(new Ellipse2D.Double(-20, 470, 420, 420));

        RoundRectangle2D ticket = new RoundRectangle2D.Double(90, 80, 1220, 560, 34, 34);
        graphics.setColor(new Color(251, 251, 253));
        graphics.fill(ticket);
        graphics.setColor(new Color(0, 0, 0, 20));
        graphics.setStroke(new BasicStroke(2f));
        graphics.draw(ticket);

        graphics.setStroke(new BasicStroke(3f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND, 0, new float[]{10, 14}, 0));
        graphics.setColor(new Color(0, 0, 0, 46));
        graphics.drawLine(1000, 120, 1000, 600);
        graphics.setStroke(new BasicStroke(1f));

        drawText(graphics, "CineSaga", 140, 160, 46, Font.BOLD, new Color(15, 15, 18), 400);
        drawText(graphics, "ADMIT ONE", 140, 202, 20, Font.BOLD, new Color(0, 113, 227), 300);
        drawText(graphics, booking.getMovieName(), 140, 300, 58, Font.BOLD, new Color(29, 29, 31), 780);

        drawField(graphics, "THEATER", booking.getSaloonName(), 140, 370, 260);
        drawField(graphics, "DATE", booking.getMovieDay(), 140, 455, 210);
        drawField(graphics, "TIME", booking.getMovieStartTime(), 380, 455, 180);
        drawField(graphics, "SEATS", chairNumbers, 620, 455, 180);
        drawField(graphics, "TOTAL", "INR " + totalAmount.toPlainString(), 820, 455, 150);

        drawText(graphics, "EMAIL", 140, 545, 18, Font.BOLD, new Color(110, 110, 115), 180);
        drawText(graphics, maskEmail(booking.getEmail()), 140, 580, 24, Font.BOLD, new Color(29, 29, 31), 590);

        drawText(graphics, "Ticket ID", 1045, 158, 28, Font.BOLD, new Color(29, 29, 31), 240);
        drawText(graphics, booking.getBookingCode(), 1045, 216, 44, Font.BOLD, new Color(29, 29, 31), 235, 24);
        if (!drawQrCode(graphics, 1060, 265, 170, qrCodePayload)) {
            drawPseudoQr(graphics, 1060, 265, 170, booking.getBookingCode());
        }
        drawBarcode(graphics, 1045, 505, 220, 72, booking.getBookingCode() + chairNumbers);
        drawText(graphics, "Show this ticket at the theater entrance", 1045, 610, 16, Font.BOLD, new Color(110, 110, 115), 260);

        graphics.setColor(new Color(11, 11, 13));
        for (int y = 120; y <= 600; y += 34) {
            graphics.fill(new Ellipse2D.Double(993, y - 7, 14, 14));
        }
        graphics.fill(new Ellipse2D.Double(56, 326, 68, 68));
        graphics.fill(new Ellipse2D.Double(1276, 326, 68, 68));
        graphics.dispose();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(image, "png", outputStream);
        return outputStream.toByteArray();
    }

    private void drawField(Graphics2D graphics, String label, String value, int x, int y, int maxWidth) {
        drawText(graphics, label, x, y, 18, Font.BOLD, new Color(110, 110, 115), maxWidth);
        drawText(graphics, value, x, y + 38, 28, Font.BOLD, new Color(29, 29, 31), maxWidth);
    }

    private void drawText(Graphics2D graphics, String text, int x, int y, int size, int style, Color color, int maxWidth) {
        drawText(graphics, text, x, y, size, style, color, maxWidth, Math.max(12, size / 2));
    }

    private void drawText(Graphics2D graphics, String text, int x, int y, int size, int style, Color color, int maxWidth, int minSize) {
        String value = text == null || text.isBlank() ? "-" : text;
        int currentSize = size;
        graphics.setFont(new Font("Arial", style, currentSize));
        graphics.setColor(color);

        while (currentSize > minSize && graphics.getFontMetrics().stringWidth(value) > maxWidth) {
            currentSize--;
            graphics.setFont(new Font("Arial", style, currentSize));
        }
        if (graphics.getFontMetrics().stringWidth(value) <= maxWidth) {
            graphics.drawString(value, x, y);
            return;
        }

        while (value.length() > 3 && graphics.getFontMetrics().stringWidth(value + "...") > maxWidth) {
            value = value.substring(0, value.length() - 1);
        }
        if (!value.equals(text) && !value.endsWith("...")) {
            value = value + "...";
        }
        graphics.drawString(value, x, y);
    }

    private boolean drawQrCode(Graphics2D graphics, int x, int y, int size, String qrCodePayload) {
        if (!StringUtils.hasText(qrCodePayload)) {
            return false;
        }

        try {
            BufferedImage qrImage = buildQrCodeBufferedImage(qrCodePayload, size);
            graphics.setColor(Color.WHITE);
            graphics.fillRect(x - 8, y - 8, size + 16, size + 16);
            graphics.drawImage(qrImage, x, y, size, size, null);
            return true;
        } catch (WriterException exception) {
            return false;
        }
    }

    private byte[] buildQrCodeImage(String qrCodePayload, int size) throws IOException, WriterException {
        BufferedImage qrImage = buildQrCodeBufferedImage(qrCodePayload, size);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(qrImage, "png", outputStream);
        return outputStream.toByteArray();
    }

    private BufferedImage buildQrCodeBufferedImage(String qrCodePayload, int size) throws WriterException {
        String payload = StringUtils.hasText(qrCodePayload) ? qrCodePayload : "CINESAGA";
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1);

        BitMatrix bitMatrix = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, size, size, hints);
        BufferedImage qrImage = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                qrImage.setRGB(x, y, bitMatrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
            }
        }
        return qrImage;
    }

    private void drawPseudoQr(Graphics2D graphics, int x, int y, int size, String seed) {
        graphics.setColor(Color.WHITE);
        graphics.fillRect(x, y, size, size);
        graphics.setColor(new Color(17, 17, 17));
        int cells = 17;
        int cell = size / cells;
        int hashSeed = Math.abs(seed == null ? 0 : seed.hashCode());
        for (int row = 0; row < cells; row++) {
            for (int col = 0; col < cells; col++) {
                boolean finder = (row <= 5 && col <= 5) || (row <= 5 && col >= cells - 6) || (row >= cells - 6 && col <= 5);
                boolean filled = finder || ((row * 31 + col * 17 + hashSeed) % 5 < 2);
                if (filled) {
                    graphics.fillRect(x + col * cell + 1, y + row * cell + 1, cell - 2, cell - 2);
                }
            }
        }
    }

    private void drawBarcode(Graphics2D graphics, int x, int y, int width, int height, String seed) {
        graphics.setColor(Color.WHITE);
        graphics.fillRect(x, y, width, height);
        graphics.setColor(new Color(17, 17, 17));
        int hashSeed = Math.abs(seed == null ? 0 : seed.hashCode());
        int cursor = x + 8;
        while (cursor < x + width - 8) {
            int lineWidth = 2 + Math.abs(hashSeed + cursor) % 4;
            int gap = 3 + Math.abs(hashSeed + cursor) % 5;
            graphics.fillRect(cursor, y + 8, lineWidth, height - 16);
            cursor += lineWidth + gap;
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "";
        }
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String start = local.substring(0, Math.min(3, local.length()));
        String end = local.length() > 5 ? local.substring(local.length() - 2) : "";
        return start + "***" + end + "@" + parts[1];
    }
}
