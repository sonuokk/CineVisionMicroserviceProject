<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>CineSaga Ticket</title>
</head>
<body style="margin:0;background:#f5f5f7;font-family:Arial,sans-serif;color:#1d1d1f;">
<div style="max-width:640px;margin:0 auto;padding:32px 18px;">
    <div style="background:#ffffff;border:1px solid #e5e5ea;border-radius:24px;padding:28px;">
        <p style="margin:0 0 8px;color:#0071e3;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">CineSaga Ticket</p>
        <h1 style="margin:0 0 18px;font-size:30px;">Your ticket is booked</h1>
        <p style="margin:0 0 24px;color:#6e6e73;line-height:1.55;">Hi ${fullName!"Guest"}, your booking is confirmed. Please show this ticket at the theater entrance.</p>

        <div style="background:#f5f5f7;border-radius:18px;padding:18px;margin-bottom:18px;">
            <div style="font-size:12px;color:#6e6e73;text-transform:uppercase;letter-spacing:.12em;">Ticket ID</div>
            <div style="font-size:32px;font-weight:900;letter-spacing:.04em;color:#050505;word-break:break-word;">${bookingCode!"-"}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:10px 0;color:#6e6e73;border-bottom:1px solid #f0f0f2;">Movie</td><td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f2;">${movieName!"-"}</td></tr>
            <tr><td style="padding:10px 0;color:#6e6e73;border-bottom:1px solid #f0f0f2;">Theater</td><td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f2;">${saloonName!"-"}</td></tr>
            <tr><td style="padding:10px 0;color:#6e6e73;border-bottom:1px solid #f0f0f2;">Date</td><td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f2;">${movieDay!"-"}</td></tr>
            <tr><td style="padding:10px 0;color:#6e6e73;border-bottom:1px solid #f0f0f2;">Showtime</td><td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f2;">${movieStartTime!"-"}</td></tr>
            <tr><td style="padding:10px 0;color:#6e6e73;border-bottom:1px solid #f0f0f2;">Seats</td><td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f2;">${chairNumbers!"-"}</td></tr>
            <tr><td style="padding:10px 0;color:#6e6e73;border-bottom:1px solid #f0f0f2;">Amount</td><td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f2;">${totalAmount!"-"}</td></tr>
        </table>

        <#if qrCodeUrl?has_content>
            <div style="margin:18px 0;padding:16px;border-radius:18px;border:1px solid #d9e4f2;background:#fbfdff;">
                <img src="${qrCodeUrl}" alt="Scannable CineSaga ticket QR code" style="display:block;width:160px;height:160px;margin:0 auto 12px;border:8px solid #ffffff;border-radius:14px;" />
                <div style="font-size:14px;font-weight:800;text-align:center;color:#1d1d1f;">Scannable Ticket QR</div>
            </div>
        </#if>

        <p style="margin:22px 0 0;color:#6e6e73;font-size:13px;">Enjoy the show from everyone at CineSaga.</p>
    </div>
</div>
</body>
</html>
