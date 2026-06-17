import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast, ToastContainer } from 'react-toastify'
import { UserService } from '../../services/userService'

export default function BookedTicketsPage() {
    const userService = useMemo(() => new UserService(), [])
    const currentUser = useSelector(state => state.user.payload)
    const [users, setUsers] = useState([])
    const [searchText, setSearchText] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")

    const tickets = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase()
        return users.flatMap(user => normalizeBookedTickets(user.bookedMovies).map(ticket => ({
            user,
            ticket
        })))
            .filter(item => statusFilter === "ALL" || getTicketStatus(item.ticket) === statusFilter)
            .filter(item => {
                if (!normalizedSearch) {
                    return true
                }
                return [
                    item.user.fullName,
                    item.user.email,
                    getTicketCode(item.ticket),
                    getTicketMovieName(item.ticket),
                    getTicketTheaterName(item.ticket),
                    getTicketSeats(item.ticket)
                ].filter(Boolean).some(value => String(value).toLowerCase().includes(normalizedSearch))
            })
            .sort((left, right) => new Date(right.ticket.bookedAt || 0).getTime() - new Date(left.ticket.bookedAt || 0).getTime())
    }, [users, searchText, statusFilter])

    const confirmedCount = tickets.filter(item => getTicketStatus(item.ticket) === "CONFIRMED").length
    const cancelledCount = tickets.filter(item => getTicketStatus(item.ticket) === "CANCELLED").length
    const pageRole = hasRole(currentUser, "ADMIN") ? "Super Admin" : "Theatre Manager"

    useEffect(() => {
        userService.getBookedTicketUsers()
            .then(result => setUsers(result.data || []))
            .catch(error => toast.error(error.response?.data?.message || "Could not load booked tickets.", {
                theme: "colored",
                position: "top-center"
            }))
    }, [userService])

    return (
        <div className='admin-page booked-tickets-page'>
            <section className='booked-tickets-hero'>
                <div>
                    <p className='booking-kicker'>{pageRole}</p>
                    <h2>Booked Tickets</h2>
                    <p>Track every ticket booking visible to your role.</p>
                </div>
                <div className='booked-ticket-stats'>
                    <span><strong>{tickets.length}</strong>Total</span>
                    <span><strong>{confirmedCount}</strong>Confirmed</span>
                    <span><strong>{cancelledCount}</strong>Cancelled</span>
                </div>
            </section>

            <section className='booked-ticket-toolbar'>
                <input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder='Search ticket, movie, theatre, customer, or seat' />
                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                    <option value='ALL'>All status</option>
                    <option value='CONFIRMED'>Confirmed</option>
                    <option value='CANCELLED'>Cancelled</option>
                </select>
                <button type='button' className='btn btn-outline-dark' onClick={() => {
                    setSearchText("")
                    setStatusFilter("ALL")
                }}>Reset</button>
            </section>

            <section className='booked-ticket-list'>
                {tickets.length === 0 ? (
                    <div className='booked-ticket-empty'>
                        <i className='fa-solid fa-ticket'></i>
                        <h3>No booked tickets found</h3>
                        <p>Tickets will appear here as soon as customers book seats.</p>
                    </div>
                ) : tickets.map(({ user, ticket }, index) => (
                    <article className='booked-ticket-card' key={`${getTicketCode(ticket)}-${user.email}-${index}`}>
                        <div className='booked-ticket-main'>
                            <div>
                                <span className='ticket-status-pill'>{getTicketStatus(ticket)}</span>
                                <h3>{getTicketMovieName(ticket)}</h3>
                                <p>{getTicketTheaterName(ticket) || "-"}</p>
                            </div>
                            <strong>{getTicketCode(ticket) || "No code"}</strong>
                        </div>
                        <div className='booked-ticket-grid'>
                            <span>Customer <strong>{user.fullName || user.email}</strong></span>
                            <span>Email <strong>{user.email}</strong></span>
                            <span>Date <strong>{ticket.movieDay || "-"}</strong></span>
                            <span>Time <strong>{ticket.showtimeStartTime || ticket.movieStartTime || "-"}</strong></span>
                            <span>Seats <strong>{getTicketSeats(ticket) || "-"}</strong></span>
                            <span>Total <strong>{formatCurrency(ticket.totalAmount)}</strong></span>
                        </div>
                    </article>
                ))}
            </section>
            <ToastContainer />
        </div>
    )
}

function normalizeBookedTickets(bookedMovies) {
    return Array.isArray(bookedMovies) ? bookedMovies.filter(ticket => ticket && typeof ticket === "object") : []
}

function getTicketCode(ticket) {
    return ticket?.bookingCode || ticket?.code || ticket?.ticketCode || ""
}

function getTicketMovieName(ticket) {
    return ticket?.movie?.movieName || ticket?.movieName || "Movie Ticket"
}

function getTicketTheaterName(ticket) {
    return ticket?.theatreName || ticket?.theaterName || ticket?.saloonName || ""
}

function getTicketSeats(ticket) {
    if (Array.isArray(ticket?.seats)) {
        return ticket.seats.join(", ")
    }
    if (typeof ticket?.chairNumbers === "string") {
        return ticket.chairNumbers
    }
    return ""
}

function getTicketStatus(ticket) {
    return String(ticket?.status || "CONFIRMED").toUpperCase()
}

function formatCurrency(value) {
    return `INR ${Number(value || 0).toFixed(2)}`
}

function hasRole(user, roleName) {
    return user?.roles?.some(role => role === roleName || role === "ROLE_" + roleName)
}
