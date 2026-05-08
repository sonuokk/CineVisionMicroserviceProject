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
    const totalAmount = (studentTicketNumber * 15.00 + adultTicketNumber * 25.00).toFixed(2)

    useEffect(() => {
        if (!userFromRedux) {
            sessionStorage.setItem("cineSagaPendingPath", movieState?.id ? "/movie/" + movieState.id : "/")
            toast.warning("Please sign in before booking tickets.", {
                theme: "dark",
                position: "top-center"
            })
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
            setBookedSeats(result.data || [])
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
        if (bookedSeats.includes(seatId)) {
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
        if (bookedSeats.includes(seatId)) {
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
            cardSecurityCode: ""
        })
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
                                        <span>Price $25</span>
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
                                        <span>Price $15</span>
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
                                <p className='booking-total'>Total: <strong>${totalAmount}</strong></p>
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
                                                    disabled={bookedSeats.includes(seatId)}
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
                            {ticketItem === "paySection" ? <h3 className='payment-total'>${totalAmount}</h3> : null}
                        </div>

                        {ticketItem === "paySection" ? (
                            <div className="booking-panel-body">
                                <div className='reservation-confirmation'>
                                    <div className='reservation-copy text-start'>
                                        <p className='booking-kicker'>Local checkout</p>
                                        <h4>Use card details for this booking</h4>
                                        <p>CineSaga will confirm the booking after this demo card step. The project stores only masked/hash payment records for booked tickets.</p>
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
                                            <strong>${totalAmount}</strong>
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
                                        if (selectedSeats.length !== totalTickets) {
                                            toast.warning("Please choose seats for every ticket.", {
                                                theme: "dark",
                                                position: "top-center"
                                            })
                                            return
                                        }

                                            const ticketDetail = {
                                                ...values,
                                                cardHolderName: paymentCard.cardHolderName || values.fullName,
                                                cardNumber: paymentCard.cardNumber,
                                                cardExpiry: paymentCard.cardExpiry,
                                                cardSecurityCode: paymentCard.cardSecurityCode,
                                                paymentMode: "CARD_DETAILS_LOCAL",
                                                chairNumbers: selectedSeats.join(" "),
                                                movieId: movieState?.movieId || movieState?.id,
                                            movieName: movieState?.movieName,
                                            saloonName: movieState?.saloonName,
                                            movieDay: movieState?.movieDay,
                                            movieStartTime: movieState?.movieTime,
                                            adultTicketCount: adultTicketNumber,
                                            studentTicketCount: studentTicketNumber
                                        }

                                        paymentService.sendTicketDetail(ticketDetail).then((result) => {
                                            sessionStorage.setItem("lastBooking", JSON.stringify(result.data))
                                            navigate("/paymentSuccess")
                                        }).catch((e) => toast.error(e.response?.data?.message || "Could not complete booking. Please try again.", {
                                            theme: "dark",
                                            position: "top-center"
                                        }))
                                    }}>
                                    <Form className='payment-grid'>
                                        <div className='reservation-contact-fields'>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="fullName" type="text" className="form-control" id="fullName" placeholder="Full Name" required />
                                                <label htmlFor="fullName">Full Name</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="email" type="email" className="form-control" id="email" placeholder="Email" required />
                                                <label htmlFor="email">Email</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="phone" type="tel" className="form-control" id="phone" placeholder="Phone" />
                                                <label htmlFor="phone">Phone (optional)</label>
                                            </div>
                                        </div>

                                        <div className='card-payment-panel'>
                                            <div className='reservation-assurance-icon'>
                                                <i className="fa-regular fa-credit-card"></i>
                                            </div>
                                            <div className='text-start'>
                                                <h4>Card Details</h4>
                                                <p>Use a saved demo card or enter card details for this local project checkout.</p>
                                            </div>
                                            {savedCards.length > 0 ? (
                                                <div className='form-floating'>
                                                    <select className='form-select' id='savedCardSelect' value={selectedSavedCardId}
                                                        onChange={event => applySavedCard(event.target.value)}>
                                                        <option value="">Enter a new card</option>
                                                        {savedCards.map(card => (
                                                            <option key={card.cardId} value={card.cardId}>
                                                                {(card.nickname || card.cardBrand || "Card") + " - " + (card.maskedCardNumber || "")}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <label htmlFor='savedCardSelect'>Saved Card</label>
                                                </div>
                                            ) : null}
                                            <div className="form-floating">
                                                <input className="form-control" id="cardHolderName" placeholder='Card Holder Name'
                                                    value={paymentCard.cardHolderName}
                                                    onChange={(event) => updatePaymentCard("cardHolderName", event.target.value)} />
                                                <label htmlFor="cardHolderName">Card Holder Name</label>
                                            </div>
                                            <div className="form-floating">
                                                <Cleave className="form-control" id="floatingCardNumber" placeholder='Credit Card Number' required
                                                    value={paymentCard.cardNumber}
                                                    onChange={(event) => updatePaymentCard("cardNumber", event.target.value)}
                                                    options={{ creditCard: true }} />
                                                <label htmlFor="floatingCardNumber">Card Number</label>
                                            </div>
                                            <div className='row'>
                                                <div className='col-sm-6'>
                                                    <div className="form-floating">
                                                        <Cleave type="text" className="form-control" id="floatingCardLastDate" placeholder='Expiry Date' required
                                                            value={paymentCard.cardExpiry}
                                                            onChange={(event) => updatePaymentCard("cardExpiry", event.target.value)}
                                                            options={{ date: true, datePattern: ['m', 'y'] }} />
                                                        <label htmlFor="floatingCardLastDate">Expiry</label>
                                                    </div>
                                                </div>
                                                <div className='col-sm-6'>
                                                    <div className="form-floating">
                                                        <input type="password" className="form-control" maxLength="4" id="floatingSecurityNumber" placeholder="Security Code" required
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
                                        </div>

                                        <div className='payment-actions'>
                                            <button type='button' className='btn btn-outline-dark' onClick={() => setTicketItem("placeSection")}>Back</button>
                                            <button type='submit' className='btn btn-dark'>Pay & Confirm Ticket</button>
                                        </div>
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
