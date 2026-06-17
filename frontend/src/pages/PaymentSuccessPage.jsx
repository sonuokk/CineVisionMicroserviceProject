import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  buildQrCodeUrl as buildTicketQrCodeUrl,
  buildTicketQrPayload as buildDownloadTicketQrPayload
} from '../utils/ticketImage'

export default function PaymnetSuccessPage() {
  const navigate = useNavigate()
  const userFromRedux = useSelector(state => state.user.payload)
  const booking = (() => {
    try {
      const storedBooking = JSON.parse(sessionStorage.getItem("lastBooking") || "null")
      const bookingUserEmail = sessionStorage.getItem("lastBookingUserEmail")
      const currentUserEmail = userFromRedux?.email?.toLowerCase()

      if (!storedBooking || !currentUserEmail || bookingUserEmail !== currentUserEmail) {
        return null
      }

      return storedBooking
    } catch {
      return null
    }
  })()
  const maskedEmail = maskEmail(booking?.recipientEmail)
  const bookingMessage = maskEmailInText(booking?.message, booking?.recipientEmail)
  const emailMessage = maskEmailInText(booking?.emailMessage, booking?.recipientEmail)
  const ticketQrPayload = booking ? buildDownloadTicketQrPayload(booking) : ""
  const ticketQrUrl = buildTicketQrCodeUrl(ticketQrPayload)

  function closeConfirmation() {
    sessionStorage.removeItem("lastBooking")
    sessionStorage.removeItem("lastBookingUserEmail")
    navigate("/")
  }

  function downloadTicket() {
    if (!booking) {
      return
    }

    downloadTicketImage(booking, maskedEmail)
  }

  return (
    <div className='success-page apple-page-shell'>
        <div className='success-card container'>
            <p className='booking-kicker'>Confirmed</p>
            <h2>{booking ? "Ticket Confirmed" : "No Recent Ticket"}</h2>
            <p>{bookingMessage || "Book a ticket from this account to see confirmation details here."}</p>

            <div className='ticket-success-actions' aria-label='Ticket confirmation actions'>
              {booking ? (
                <button type='button' className='btn btn-dark' onClick={downloadTicket}>
                  <i className='fa-solid fa-download me-2'></i>Download Ticket
                </button>
              ) : null}
              <button type='button' className='btn btn-outline-dark' onClick={() => navigate(-1)}>
                <i className='fa-solid fa-arrow-left me-2'></i>Back
              </button>
              <button type='button' className='btn btn-outline-dark' onClick={closeConfirmation}>
                <i className='fa-solid fa-xmark me-2'></i>Close
              </button>
            </div>

            {booking ? (
              <div className='ticket-confirmation-card'>
                <div className='ticket-code-block'>
                  <span>Ticket ID</span>
                  <strong>{booking.bookingCode}</strong>
                </div>
                <div className='ticket-confirmation-grid'>
                  <span>Movie</span><strong>{booking.movieName}</strong>
                  <span>Theater</span><strong>{booking.saloonName}</strong>
                  <span>Date</span><strong>{booking.movieDay}</strong>
                  <span>Showtime</span><strong>{booking.movieStartTime}</strong>
                  <span>Seats</span><strong>{booking.chairNumbers}</strong>
                  <span>Total</span><strong>{formatCurrency(booking.totalAmount)}</strong>
                  <span>Email</span><strong>{maskedEmail}</strong>
                </div>
                <div className='ticket-real-qr'>
                  <img src={ticketQrUrl} alt='Scannable ticket QR code' />
                  <div>
                    <strong>Scannable Ticket QR</strong>
                    <span>Scan this code to read the ticket ID, movie, theatre, date, time, seats, and amount.</span>
                  </div>
                </div>
                <p className={`email-status-note ${booking.emailStatus === "SENT" ? "sent" : "failed"}`}>
                  {emailMessage}
                </p>
              </div>
            ) : null}

            <h5>
                Enjoy the show from everyone at CineSaga.
            </h5>
        </div>
    </div>
  )
}

function maskEmail(email) {
  if (!email || !email.includes("@")) {
    return email || ""
  }

  const [localPart, domain] = email.split("@")
  const visibleStart = localPart.slice(0, Math.min(3, localPart.length))
  const visibleEnd = localPart.length > 5 ? localPart.slice(-2) : ""
  return `${visibleStart}***${visibleEnd}@${domain}`
}

function maskEmailInText(text, email) {
  if (!text) {
    return ""
  }
  if (!email) {
    return text
  }
  return text.replaceAll(email, maskEmail(email))
}

async function downloadTicketImage(booking, maskedEmail) {
  const canvas = document.createElement("canvas")
  canvas.width = 1400
  canvas.height = 720
  const ctx = canvas.getContext("2d")
  const ticketQrImage = await loadImage(buildQrCodeUrl(buildTicketQrPayload(booking))).catch(() => null)

  drawTicket(ctx, booking, maskedEmail, ticketQrImage)

  const link = document.createElement("a")
  link.download = `${booking.bookingCode || "cinesaga-ticket"}.png`
  link.href = canvas.toDataURL("image/png")
  link.click()
}

function drawTicket(ctx, booking, maskedEmail, ticketQrImage) {
  const width = 1400
  const height = 720
  ctx.clearRect(0, 0, width, height)

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, "#0b0b0d")
  bg.addColorStop(0.55, "#232326")
  bg.addColorStop(1, "#050505")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = "rgba(255,255,255,0.08)"
  ctx.beginPath()
  ctx.arc(1130, 100, 220, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(180, 650, 210, 0, Math.PI * 2)
  ctx.fill()

  roundRect(ctx, 90, 80, 1220, 560, 34)
  ctx.fillStyle = "#fbfbfd"
  ctx.fill()

  roundRect(ctx, 92, 82, 1216, 556, 32)
  const ticketGradient = ctx.createLinearGradient(90, 80, 1310, 640)
  ticketGradient.addColorStop(0, "#ffffff")
  ticketGradient.addColorStop(0.58, "#f5f5f7")
  ticketGradient.addColorStop(1, "#e9eef7")
  ctx.fillStyle = ticketGradient
  ctx.fill()

  ctx.strokeStyle = "rgba(0,0,0,0.08)"
  ctx.lineWidth = 2
  roundRect(ctx, 90, 80, 1220, 560, 34)
  ctx.stroke()

  ctx.setLineDash([10, 14])
  ctx.strokeStyle = "rgba(0,0,0,0.18)"
  ctx.beginPath()
  ctx.moveTo(1000, 120)
  ctx.lineTo(1000, 600)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = "#0f0f12"
  ctx.font = "800 46px Arial"
  ctx.fillText("CineSaga", 140, 160)
  ctx.font = "700 20px Arial"
  ctx.fillStyle = "#0071e3"
  ctx.fillText("ADMIT ONE", 140, 202)

  ctx.fillStyle = "#1d1d1f"
  ctx.font = "800 58px Arial"
  fitText(ctx, booking.movieName || "Movie Ticket", 140, 300, 780)

  drawField(ctx, "THEATER", booking.saloonName, 140, 370)
  drawField(ctx, "DATE", booking.movieDay, 140, 455)
  drawField(ctx, "TIME", booking.movieStartTime, 380, 455)
  drawField(ctx, "SEATS", booking.chairNumbers, 620, 455)
  drawField(ctx, "TOTAL", formatCurrency(booking.totalAmount), 820, 455)

  ctx.fillStyle = "#6e6e73"
  ctx.font = "600 18px Arial"
  ctx.fillText("EMAIL", 140, 545)
  ctx.fillStyle = "#1d1d1f"
  ctx.font = "700 24px Arial"
  fitText(ctx, maskedEmail || "", 140, 580, 590)

  ctx.fillStyle = "#1d1d1f"
  ctx.font = "800 28px Arial"
  ctx.fillText("Ticket ID", 1045, 158)
  ctx.font = "800 44px Arial"
  fitText(ctx, booking.bookingCode || "", 1045, 216, 235, { minFontSize: 24 })

  if (ticketQrImage) {
    ctx.drawImage(ticketQrImage, 1060, 265, 170, 170)
  } else {
    drawPseudoQr(ctx, 1060, 265, 170, booking.bookingCode || "CINESAGA")
  }
  drawBarcode(ctx, 1045, 505, 220, 72, `${booking.bookingCode || ""}${booking.chairNumbers || ""}`)

  ctx.fillStyle = "#6e6e73"
  ctx.font = "600 16px Arial"
  ctx.fillText("Show this ticket at the theater entrance", 1045, 610)

  ctx.fillStyle = "#0b0b0d"
  for (let y = 120; y <= 600; y += 34) {
    ctx.beginPath()
    ctx.arc(1000, y, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = "#0b0b0d"
  ctx.beginPath()
  ctx.arc(90, 360, 34, -Math.PI / 2, Math.PI / 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(1310, 360, 34, Math.PI / 2, Math.PI * 1.5)
  ctx.fill()
}

function drawField(ctx, label, value, x, y) {
  ctx.fillStyle = "#6e6e73"
  ctx.font = "600 18px Arial"
  ctx.fillText(label, x, y)
  ctx.fillStyle = "#1d1d1f"
  ctx.font = "800 28px Arial"
  fitText(ctx, value || "-", x, y + 38, 210)
}

function fitText(ctx, text, x, y, maxWidth, options = {}) {
  const value = String(text || "")
  if (ctx.measureText(value).width <= maxWidth) {
    ctx.fillText(value, x, y)
    return
  }

  if (options.minFontSize) {
    const fontParts = ctx.font.match(/^(\d+)\s+(\d+)px\s+(.+)$/)
    if (fontParts) {
      const [, weight, size, family] = fontParts
      let currentSize = Number(size)
      while (currentSize > options.minFontSize && ctx.measureText(value).width > maxWidth) {
        currentSize -= 1
        ctx.font = `${weight} ${currentSize}px ${family}`
      }
      if (ctx.measureText(value).width <= maxWidth) {
        ctx.fillText(value, x, y)
        return
      }
    }
  }

  let clipped = value
  while (clipped.length > 3 && ctx.measureText(clipped + "...").width > maxWidth) {
    clipped = clipped.slice(0, -1)
  }
  ctx.fillText(clipped + "...", x, y)
}

function drawPseudoQr(ctx, x, y, size, seed) {
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(x, y, size, size)
  ctx.strokeStyle = "rgba(0,0,0,0.12)"
  ctx.strokeRect(x, y, size, size)

  const cells = 17
  const cell = size / cells
  const hashSeed = hashCode(seed)
  ctx.fillStyle = "#111111"

  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      const finder = isFinderCell(row, col, cells)
      const filled = finder || ((row * 31 + col * 17 + hashSeed) % 5 < 2)
      if (filled) {
        ctx.fillRect(x + col * cell + 1, y + row * cell + 1, cell - 2, cell - 2)
      }
    }
  }

  drawFinder(ctx, x + cell, y + cell, cell * 5)
  drawFinder(ctx, x + size - cell * 6, y + cell, cell * 5)
  drawFinder(ctx, x + cell, y + size - cell * 6, cell * 5)
}

function drawFinder(ctx, x, y, size) {
  ctx.fillStyle = "#111111"
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(x + size * 0.22, y + size * 0.22, size * 0.56, size * 0.56)
  ctx.fillStyle = "#111111"
  ctx.fillRect(x + size * 0.36, y + size * 0.36, size * 0.28, size * 0.28)
}

function isFinderCell(row, col, cells) {
  const topLeft = row <= 5 && col <= 5
  const topRight = row <= 5 && col >= cells - 6
  const bottomLeft = row >= cells - 6 && col <= 5
  return topLeft || topRight || bottomLeft
}

function drawBarcode(ctx, x, y, width, height, seed) {
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = "#111111"
  const hashSeed = Math.abs(hashCode(seed))
  let cursor = x + 8
  while (cursor < x + width - 8) {
    const lineWidth = 2 + ((hashSeed + cursor) % 4)
    const gap = 3 + ((hashSeed + cursor) % 5)
    ctx.fillRect(cursor, y + 8, lineWidth, height - 16)
    cursor += lineWidth + gap
  }
}

function hashCode(value) {
  return String(value).split("").reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0)
  }, 0)
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function buildTicketQrPayload(booking) {
  if (booking?.qrCodePayload) {
    return booking.qrCodePayload
  }

  return [
    "CineSaga Ticket",
    `Booking: ${booking.bookingCode || ""}`,
    `Movie: ${booking.movieName || ""}`,
    `Theatre: ${booking.saloonName || ""}`,
    `Date: ${booking.movieDay || ""}`,
    `Time: ${booking.movieStartTime || ""}`,
    `Seats: ${booking.chairNumbers || ""}`,
    `Amount: ${formatCurrency(booking.totalAmount)}`
  ].join("\n")
}

function buildQrCodeUrl(payload) {
  if (!payload) {
    return ""
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toFixed(2)}`
}
