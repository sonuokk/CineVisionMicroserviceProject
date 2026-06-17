import Cleave from 'cleave.js/react'
import { Form, Formik } from 'formik'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import { PaymentService } from '../services/paymentService'
import { UserService } from '../services/userService'
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput'

const seatRows = [
    ["F1", "F2", "F3", "F4", "F5", "F6", "F7"],
    ["E1", "E2", "E3", "E4", "E5", "E6"],
    ["D1", "D2", "D3", "D4", "D5", "D6"],
    ["C1", "C2", "C3", "C4", "C5", "C6"],
    ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"],
    ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]
]

const merchantUpiId = process.env.REACT_APP_CINESAGA_UPI_ID || ""
const merchantUpiName = process.env.REACT_APP_CINESAGA_UPI_NAME || "CineSaga"
const ADULT_TICKET_PRICE = 250
const STUDENT_TICKET_PRICE = 150

export default function BuyTicketPage() {

    const navigate = useNavigate()
    const paymentService = useMemo(() => new PaymentService(), [])
    const userService = useMemo(() => new UserService(), [])

    const [ticketItem, setTicketItem] = useState("ticketSection")
    const [adultTicketNumber, setAdultTicketNumber] = useState(0)
    const [studentTicketNumber, setStudentTicketNumber] = useState(0)
    const [selectedSeats, setSelectedSeats] = useState([])
    const [bookedSeats, setBookedSeats] = useState([])
    const [profileContact, setProfileContact] = useState({ phone: "" })
    const [savedCards, setSavedCards] = useState([])
    const [selectedSavedCardId, setSelectedSavedCardId] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("card")
    const [isBooking, setIsBooking] = useState(false)
    const [bookingStatus, setBookingStatus] = useState("")
    const [paymentCard, setPaymentCard] = useState({
        cardHolderName: "",
        cardNumber: "",
        cardExpiry: "",
        cardSecurityCode: ""
    })
    const movieState = useSelector(state => state.movie.payload)
    const userFromRedux = useSelector(state => state.user.payload)

    const totalTickets = adultTicketNumber + studentTicketNumber
    const remainingSeats = totalTickets - selectedSeats.length
    const totalAmount = (studentTicketNumber * STUDENT_TICKET_PRICE + adultTicketNumber * ADULT_TICKET_PRICE).toFixed(2)
    const upiPaymentUri = buildUpiPaymentUri({
        upiId: merchantUpiId,
        name: merchantUpiName,
        amount: totalAmount,
        note: `${movieState?.movieName || "CineSaga"} tickets`
    })
    const upiQrUrl = buildQrCodeUrl(upiPaymentUri)

    useEffect(() => {
        if (!userFromRedux) {
            sessionStorage.setItem("cineSagaPendingPath", movieState?.id ? "/movie/" + movieState.id : "/")
            setTimeout(() => {
                document.querySelector('[data-bs-target="#loginModal"]')?.click()
            }, 100)
            return
        }

        if (!movieState?.movieName) {
            toast.warning("Choose a movie and showtime before booking tickets.", {
                theme: "dark",
                position: "top-center"
            })
            navigate("/")
            return
        }

        paymentService.getBookedSeats({
            movieName: movieState?.movieName,
            saloonName: movieState?.saloonName,
            movieDay: movieState?.movieDay,
            movieStartTime: movieState?.movieTime
        }).then(result => {
            const booked = (result.data || []).map(seat => String(seat).toUpperCase())
            setBookedSeats(booked)
            setSelectedSeats(currentSeats => currentSeats.filter(seat => !booked.includes(seat)))
        }).catch(() => setBookedSeats([]))

        userService.getProfile().then(result => {
            setProfileContact({ phone: result.data?.phone || "" })
            setSavedCards(result.data?.savedPaymentCards || [])
        }).catch(() => setSavedCards([]))
    }, [movieState, navigate, paymentService, userFromRedux, userService])

    useEffect(() => {
        setSelectedSeats(currentSeats => currentSeats.slice(0, totalTickets))
    }, [totalTickets])

    function changeTicketCount(type, direction) {
        if (type === "adult") {
            setAdultTicketNumber(count => Math.max(0, count + direction))
        } else {
            setStudentTicketNumber(count => Math.max(0, count + direction))
        }
    }

    function selectSeat(seatId) {
        if (bookedSeats.includes(seatId.toUpperCase())) {
            toast.warning("That seat is already booked. Please choose another one.", {
                theme: "dark",
                position: "top-center"
            })
            return
        }

        setSelectedSeats(currentSeats => {
            if (currentSeats.includes(seatId)) {
                return currentSeats.filter(seat => seat !== seatId)
            }
            if (currentSeats.length >= totalTickets) {
                toast.warning("You already selected seats for every ticket.", {
                    theme: "dark",
                    position: "top-center"
                })
                return currentSeats
            }
            return [...currentSeats, seatId]
        })
    }

    function seatClassName(seatId) {
        if (bookedSeats.includes(seatId.toUpperCase())) {
            return "seat-button is-booked"
        }
        if (selectedSeats.includes(seatId)) {
            return "seat-button is-selected"
        }
        return "seat-button"
    }

    function updatePaymentCard(field, value) {
        setPaymentCard(currentCard => ({
            ...currentCard,
            [field]: value
        }))
    }

    function applySavedCard(cardId) {
        setSelectedSavedCardId(cardId)
        const savedCard = savedCards.find(card => card.cardId === cardId)
        if (!savedCard) {
            setPaymentCard({
                cardHolderName: "",
                cardNumber: "",
                cardExpiry: "",
                cardSecurityCode: ""
            })
            return
        }

        setPaymentCard({
            cardHolderName: savedCard.cardHolderName || userFromRedux?.fullName || "",
            cardNumber: savedCard.cardNumber || "",
            cardExpiry: savedCard.cardExpiry || "",
            cardSecurityCode: savedCard.cardSecurityCode || ""
        })
    }

    function savedCardLabel(card) {
        const name = card.nickname || card.cardBrand || "Saved card"
        const number = card.maskedCardNumber || (card.cardNumber ? "**** **** **** " + card.cardNumber.slice(-4) : "")
        return `${name}${number ? " - " + number : ""}`
    }

    function requireTicketsBeforeSeats() {
        if (!userFromRedux) {
            document.querySelector('[data-bs-target="#loginModal"]')?.click()
            return
        }
        if (totalTickets === 0) {
            toast.warning("Please choose at least one ticket to continue.", {
                theme: "dark",
                position: "top-center"
            })
            return
        }
        setTicketItem("placeSection")
    }

    function requireSeatsBeforePayment() {
        if (!userFromRedux) {
            document.querySelector('[data-bs-target="#loginModal"]')?.click()
            return
        }
        if (remainingSeats !== 0) {
            toast.warning("Please choose seats for every ticket.", {
                theme: "dark",
                position: "top-center"
            })
            return
        }
        setTicketItem("paySection")
    }

    return (
        !userFromRedux ? (
            <div className='ticket-page booking-shell auth-required-shell'>
                <div className='auth-required-panel'>
                    <p className='booking-kicker'>Sign in required</p>
                    <h2>Login first to book tickets</h2>
                    <p>Movie browsing is open, but ticket selection and local reservation are available only after sign in.</p>
                    <button type='button' className='btn btn-dark' data-bs-toggle="modal" data-bs-target="#loginModal">Sign In</button>
                    <ToastContainer />
                </div>
            </div>
        ) : (
        <div className='ticket-page booking-shell'>
            <div className='booking-hero'>
                <div className='booking-poster-panel'>
                    <div className='booking-poster-backdrop' style={{ backgroundImage: `url(${movieState?.imageUrl})` }} />
                    <div className='booking-poster-content'>
                        <img className='booking-poster' src={movieState?.imageUrl} alt={movieState?.movieName || "Movie poster"} />
                        <div className='text-start'>
                            <p className='booking-kicker'>Booking</p>
                            <h2>{movieState?.movieName}</h2>
                            <p><i className="fa-solid fa-location-dot me-2"></i>{movieState?.saloonName}</p>
                            <p><i className="fa-solid fa-calendar-days me-2"></i>{movieState?.movieDay}</p>
                            <p><i className="fa-regular fa-clock me-2"></i>{movieState?.movieTime}</p>
                        </div>
                    </div>
                </div>

                <div className='booking-flow'>
                    <div className='booking-stepper' aria-label='Booking progress'>
                        {["Tickets", "Seats", "Payment"].map((step, index) => {
                            const activeIndex = ticketItem === "ticketSection" ? 0 : ticketItem === "placeSection" ? 1 : 2
                            return (
                                <div key={step} className={`booking-step ${index <= activeIndex ? "active" : ""}`}>
                                    <span>{index + 1}</span>
                                    {step}
                                </div>
                            )
                        })}
                    </div>

                    <section className={`booking-panel ${ticketItem === "ticketSection" ? "is-open" : ""}`}>
                        <div className='booking-panel-header'>
                            <div>
                                <p className='booking-kicker'>Step 1</p>
                                <h3>Choose Tickets</h3>
                            </div>
                            {ticketItem === "ticketSection" ? (
                                <button type='button' className='btn btn-dark' onClick={requireTicketsBeforeSeats}>Continue</button>
                            ) : (
                                <button type='button' className='btn btn-outline-dark' onClick={() => setTicketItem("ticketSection")}>Change</button>
                            )}
                        </div>

                        {ticketItem === 'ticketSection' ? (
                            <div className='booking-panel-body'>
                                <p className='booking-help'>Select ticket types before choosing seats. Student ticket holders should bring a valid student ID.</p>
                                <div className='ticket-type-row'>
                                    <div>
                                        <strong>Adult</strong>
                                        <span>Price {formatCurrency(ADULT_TICKET_PRICE)}</span>
                                    </div>
                                    <div className='ticket-counter'>
                                        <button type='button' className='icon-button' onClick={() => changeTicketCount("adult", -1)} aria-label='Remove adult ticket'>
                                            <i className="fa-solid fa-minus"></i>
                                        </button>
                                        <strong>{adultTicketNumber}</strong>
                                        <button type='button' className='icon-button' onClick={() => changeTicketCount("adult", 1)} aria-label='Add adult ticket'>
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className='ticket-type-row'>
                                    <div>
                                        <strong>Student</strong>
                                        <span>Price {formatCurrency(STUDENT_TICKET_PRICE)}</span>
                                    </div>
                                    <div className='ticket-counter'>
                                        <button type='button' className='icon-button' onClick={() => changeTicketCount("student", -1)} aria-label='Remove student ticket'>
                                            <i className="fa-solid fa-minus"></i>
                                        </button>
                                        <strong>{studentTicketNumber}</strong>
                                        <button type='button' className='icon-button' onClick={() => changeTicketCount("student", 1)} aria-label='Add student ticket'>
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                <p className='booking-total'>Total: <strong>{formatCurrency(totalAmount)}</strong></p>
                            </div>
                        ) : null}
                    </section>

                    <section className={`booking-panel ${ticketItem === "placeSection" ? "is-open" : ""}`}>
                        <div className='booking-panel-header'>
                            <div>
                                <p className='booking-kicker'>Step 2</p>
                                <h3>Choose Seats</h3>
                            </div>
                            {ticketItem === "placeSection" ? (
                                <button type='button' className='btn btn-dark' onClick={requireSeatsBeforePayment}>Continue</button>
                            ) : (
                                <button type='button' className='btn btn-outline-dark' onClick={() => setTicketItem("placeSection")} disabled={totalTickets === 0}>Change</button>
                            )}
                        </div>

                        {ticketItem === "placeSection" ? (
                            <div className='booking-panel-body'>
                                <div className='seat-summary'>
                                    <span>{selectedSeats.length} selected</span>
                                    <span>{Math.max(remainingSeats, 0)} remaining</span>
                                </div>
                                <div className='screen-indicator'>Screen</div>
                                <div className='seat-map' role='grid' aria-label='Cinema seat map'>
                                    {seatRows.map(row => (
                                        <div key={row[0][0]} className='seat-row' role='row'>
                                            <span className='seat-row-label'>{row[0][0]}</span>
                                            {row.map(seatId => (
                                                <button
                                                    key={seatId}
                                                    type='button'
                                                    className={seatClassName(seatId)}
                                                    disabled={bookedSeats.includes(seatId.toUpperCase())}
                                                    onClick={() => selectSeat(seatId)}
                                                    aria-label={`Seat ${seatId}`}
                                                >
                                                    <i className="fa-solid fa-chair"></i>
                                                    <span>{seatId}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className='seat-legend'>
                                    <span><i className='legend-dot available'></i>Available</span>
                                    <span><i className='legend-dot selected'></i>Selected</span>
                                    <span><i className='legend-dot booked'></i>Booked</span>
                                </div>
                            </div>
                        ) : null}
                    </section>

                    <section className={`booking-panel ${ticketItem === "paySection" ? "is-open" : ""}`}>
                        <div className='booking-panel-header'>
                            <div>
                                <p className='booking-kicker'>Step 3</p>
                                <h3>Payment Details</h3>
                            </div>
                            {ticketItem === "paySection" ? <h3 className='payment-total'>{formatCurrency(totalAmount)}</h3> : null}
                        </div>

                        {ticketItem === "paySection" ? (
                            <div className="booking-panel-body">
                                <div className='reservation-confirmation'>
                                    <div className='reservation-copy text-start'>
                                        <p className='booking-kicker'>Local checkout</p>
                                        <h4>Choose card or UPI QR</h4>
                                        <p>CineSaga will confirm the booking after the selected payment step. Card stays local/demo, while UPI opens your configured receiver account.</p>
                                    </div>
                                    <div className='reservation-summary' aria-label='Booking summary'>
                                        <div>
                                            <span>Tickets</span>
                                            <strong>{totalTickets}</strong>
                                        </div>
                                        <div>
                                            <span>Seats</span>
                                            <strong>{selectedSeats.join(", ")}</strong>
                                        </div>
                                        <div>
                                            <span>Total</span>
                                            <strong>{formatCurrency(totalAmount)}</strong>
                                        </div>
                                    </div>
                                </div>
                                <Formik
                                    initialValues={{
                                        fullName: userFromRedux?.fullName || "",
                                        email: userFromRedux?.email || "",
                                        phone: profileContact.phone || ""
                                    }}
                                    enableReinitialize
                                    onSubmit={(values) => {
                                        if (isBooking) {
                                            return
                                        }
                                        if (selectedSeats.length !== totalTickets) {
                                            toast.warning("Please choose seats for every ticket.", {
                                                theme: "dark",
                                                position: "top-center"
                                            })
                                            return
                                        }
                                        if (paymentMethod === "upi" && !merchantUpiId) {
                                            toast.warning("UPI receiver is not configured yet.", {
                                                theme: "dark",
                                                position: "top-center"
                                            })
                                            return
                                        }

                                            const ticketDetail = {
                                                ...values,
                                                email: userFromRedux?.email || values.email,
                                                fullName: values.fullName || userFromRedux?.fullName || "",
                                                cardHolderName: paymentCard.cardHolderName || values.fullName,
                                                cardNumber: paymentCard.cardNumber,
                                                cardExpiry: paymentCard.cardExpiry,
                                                cardSecurityCode: paymentCard.cardSecurityCode,
                                                paymentMode: paymentMethod === "upi" ? "UPI_QR" : "CARD_DETAILS_LOCAL",
                                                chairNumbers: selectedSeats.join(" "),
                                                movieId: movieState?.movieId || movieState?.id,
                                            movieName: movieState?.movieName,
                                            saloonName: movieState?.saloonName,
                                            movieDay: movieState?.movieDay,
                                            movieStartTime: movieState?.movieTime,
                                            adultTicketCount: adultTicketNumber,
                                            studentTicketCount: studentTicketNumber
                                        }

                                        setIsBooking(true)
                                        setBookingStatus(paymentMethod === "upi"
                                            ? "Confirming UPI payment and generating your ticket..."
                                            : "Please wait a second, generating your ticket...")
                                        paymentService.sendTicketDetail(ticketDetail).then((result) => {
                                            sessionStorage.setItem("lastBooking", JSON.stringify(result.data))
                                            sessionStorage.setItem("lastBookingUserEmail", (userFromRedux?.email || "").toLowerCase())
                                            navigate("/paymentSuccess")
                                        }).catch((e) => toast.error(e.response?.data?.message || "Could not complete booking. Please try again.", {
                                            theme: "dark",
                                            position: "top-center"
                                        })).finally(() => {
                                            setIsBooking(false)
                                            setBookingStatus("")
                                        })
                                    }}>
                                    <Form className='payment-grid'>
                                        <div className='reservation-contact-fields'>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="fullName" type="text" className="form-control" id="fullName" placeholder="Full Name" required />
                                                <label htmlFor="fullName">Full Name</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="email" type="email" className="form-control" id="email" placeholder="Email" readOnly required />
                                                <label htmlFor="email">Email</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="phone" type="tel" className="form-control" id="phone" placeholder="Phone" />
                                                <label htmlFor="phone">Phone (optional)</label>
                                            </div>
                                        </div>

                                        <div className='payment-method-column'>
                                        <div className='payment-method-toggle' role='tablist' aria-label='Payment method'>
                                            <button type='button' className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")}>
                                                <i className='fa-regular fa-credit-card'></i>
                                                Card
                                            </button>
                                            <button type='button' className={paymentMethod === "upi" ? "active" : ""} onClick={() => setPaymentMethod("upi")}>
                                                <i className='fa-solid fa-qrcode'></i>
                                                UPI QR
                                            </button>
                                        </div>

                                        {paymentMethod === "card" ? <div className='card-payment-panel'>
                                            <div className='reservation-assurance-icon'>
                                                <i className="fa-regular fa-credit-card"></i>
                                            </div>
                                            <div className='text-start'>
                                                <h4>Card Details</h4>
                                                <p>Use a saved demo card or enter card details for this local project checkout.</p>
                                            </div>
                                            <div className='saved-card-choice-section'>
                                                <div className='saved-card-choice-header'>
                                                    <strong>Saved cards</strong>
                                                    <span>{savedCards.length > 0 ? "Choose one or enter a new card" : "No saved cards yet"}</span>
                                                </div>
                                                <div className='saved-card-choice-grid'>
                                                    <button type='button'
                                                        className={`saved-card-choice ${selectedSavedCardId === "" ? "active" : ""}`}
                                                        onClick={() => applySavedCard("")}>
                                                        <span className='saved-card-choice-icon'><i className="fa-solid fa-plus"></i></span>
                                                        <span>
                                                            <strong>New card</strong>
                                                            <small>Type card details below</small>
                                                        </span>
                                                    </button>
                                                    {savedCards.map(card => (
                                                        <button type='button'
                                                            key={card.cardId}
                                                            className={`saved-card-choice ${selectedSavedCardId === card.cardId ? "active" : ""}`}
                                                            onClick={() => applySavedCard(card.cardId)}>
                                                            <span className='saved-card-choice-icon'><i className="fa-regular fa-credit-card"></i></span>
                                                            <span>
                                                                <strong>{card.nickname || card.cardBrand || "Card"}</strong>
                                                                <small>{card.maskedCardNumber || savedCardLabel(card)}</small>
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="form-floating">
                                                <input className="form-control" id="cardHolderName" placeholder='Card Holder Name'
                                                    value={paymentCard.cardHolderName}
                                                    onChange={(event) => updatePaymentCard("cardHolderName", event.target.value)} />
                                                <label htmlFor="cardHolderName">Card Holder Name</label>
                                            </div>
                                            <div className="form-floating">
                                                <Cleave className="form-control" id="floatingCardNumber" placeholder='Credit Card Number' required={paymentMethod === "card"}
                                                    value={paymentCard.cardNumber}
                                                    onChange={(event) => updatePaymentCard("cardNumber", event.target.value)}
                                                    options={{ creditCard: true }} />
                                                <label htmlFor="floatingCardNumber">Card Number</label>
                                            </div>
                                            <div className='row'>
                                                <div className='col-sm-6'>
                                                    <div className="form-floating">
                                                        <Cleave type="text" className="form-control" id="floatingCardLastDate" placeholder='Expiry Date' required={paymentMethod === "card"}
                                                            value={paymentCard.cardExpiry}
                                                            onChange={(event) => updatePaymentCard("cardExpiry", event.target.value)}
                                                            options={{ date: true, datePattern: ['m', 'y'] }} />
                                                        <label htmlFor="floatingCardLastDate">Expiry</label>
                                                    </div>
                                                </div>
                                                <div className='col-sm-6'>
                                                    <div className="form-floating">
                                                        <input type="password" className="form-control" maxLength="4" id="floatingSecurityNumber" placeholder="Security Code" required={paymentMethod === "card"}
                                                            value={paymentCard.cardSecurityCode}
                                                            onChange={(event) => updatePaymentCard("cardSecurityCode", event.target.value.replace(/\D/g, ""))} />
                                                        <label htmlFor="floatingSecurityNumber">CVV</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <label className='payment-terms'>
                                                <input className="form-check-input me-3" type="checkbox" required />
                                                I understand this is a test checkout and no real payment gateway will be charged.
                                            </label>
                                        </div> : <div className='card-payment-panel upi-payment-panel'>
                                            <div className='reservation-assurance-icon'>
                                                <i className="fa-solid fa-qrcode"></i>
                                            </div>
                                            <div className='text-start'>
                                                <h4>UPI QR Payment</h4>
                                                <p>Scan with any UPI app, complete the payment, then confirm the ticket here.</p>
                                            </div>
                                            {merchantUpiId ? (
                                                <div className='upi-qr-layout'>
                                                    <a className='upi-qr-box' href={upiPaymentUri}>
                                                        <img src={upiQrUrl} alt='UPI payment QR code' />
                                                    </a>
                                                    <div className='upi-payment-meta text-start'>
                                                        <span>Pay to</span>
                                                        <strong>{merchantUpiId}</strong>
                                                        <span>Amount</span>
                                                        <strong>{formatCurrency(totalAmount)}</strong>
                                                        <a className='btn btn-outline-dark' href={upiPaymentUri}>Open UPI App</a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className='upi-config-warning text-start'>
                                                    <strong>UPI receiver is not configured.</strong>
                                                    <span>Set REACT_APP_CINESAGA_UPI_ID in frontend/.env to receive payment in your account.</span>
                                                </div>
                                            )}
                                            <label className='payment-terms'>
                                                <input className="form-check-input me-3" type="checkbox" required disabled={!merchantUpiId} />
                                                I completed the UPI payment for this booking.
                                            </label>
                                        </div>}
                                        </div>

                                        <div className='payment-actions'>
                                            <button type='button' className='btn btn-outline-dark' onClick={() => setTicketItem("placeSection")}>Back</button>
                                            <button type='submit' className='btn btn-dark' disabled={isBooking || (paymentMethod === "upi" && !merchantUpiId)}>
                                                {isBooking ? "Generating Ticket..." : "Pay & Confirm Ticket"}
                                            </button>
                                        </div>
                                        {isBooking ? (
                                            <div className='booking-status-overlay' role='status' aria-live='polite'>
                                                <span className='booking-status-spinner'></span>
                                                <strong>{bookingStatus || "Please wait a second..."}</strong>
                                            </div>
                                        ) : null}
                                    </Form>
                                </Formik>
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>

            <ToastContainer />
        </div>
        )
    )
}

function buildUpiPaymentUri({ upiId, name, amount, note }) {
    if (!upiId) {
        return ""
    }
    const params = new URLSearchParams({
        pa: upiId,
        pn: name,
        am: amount,
        cu: "INR",
        tn: note
    })
    return `upi://pay?${params.toString()}`
}

function buildQrCodeUrl(payload) {
    if (!payload) {
        return ""
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`
}

function formatCurrency(value) {
    return `INR ${Number(value || 0).toFixed(2)}`
}
