import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()

  function goToMovies(filter) {
    navigate(filter === "soon" ? "/#coming-soon" : "/#movies")
    window.dispatchEvent(new CustomEvent("cineSagaMovieFilter", { detail: { filter: filter === "soon" ? "soon" : "now" } }))
    setTimeout(() => {
      document.getElementById("movies")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className='footer-grid'>
          <div className='footer-brand text-start'>
            <h3>CineSaga</h3>
            <p>Premium movie booking for showtimes, seats, and tickets in one smooth flow.</p>
          </div>

          <nav className='footer-links' aria-label='Movie links'>
            <h4>Movies</h4>
            <button type='button' onClick={() => goToMovies("now")}>Now Showing</button>
            <button type='button' onClick={() => goToMovies("soon")}>Coming Soon</button>
            <button type='button' onClick={() => goToMovies("now")}>Cinemas</button>
          </nav>

          <nav className='footer-links' aria-label='Ticket links'>
            <h4>Tickets</h4>
            <button type='button' data-bs-toggle="modal" data-bs-target="#footerTicketModal">E-Ticket</button>
            <button type='button' data-bs-toggle="modal" data-bs-target="#footerRefundModal">Refunds</button>
            <button type='button' data-bs-toggle="modal" data-bs-target="#footerTermsModal">Terms of Sale</button>
          </nav>
        </div>

        <p className="footer-copy"><strong>Copyright &copy; CineSaga 2026</strong></p>
      </div>

      <div className="modal fade" id="footerTicketModal" tabIndex="-1" aria-labelledby="footerTicketModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="footerTicketModalLabel">E-Ticket</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body text-start">
              Your confirmed booking code appears on the success page and is also sent by email when mail service credentials are configured.
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="footerRefundModal" tabIndex="-1" aria-labelledby="footerRefundModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="footerRefundModalLabel">Refunds</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body text-start">
              Demo bookings can be cancelled from support before showtime. Seat locks are released once the booking is removed from the booking table.
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="footerTermsModal" tabIndex="-1" aria-labelledby="footerTermsModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="footerTermsModalLabel">Terms of Sale</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body text-start">
              Tickets are confirmed through the local demo card checkout. Booking payment records are stored as masked values and salted hashes.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
