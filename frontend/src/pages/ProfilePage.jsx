import Cleave from 'cleave.js/react'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import { PaymentService } from '../services/paymentService'
import { UserService } from '../services/userService'
import { addUserToState, removeUserFromState } from '../store/actions/userActions'
import { downloadTicketImage } from '../utils/ticketImage'

const emptyCard = {
    cardId: "",
    nickname: "",
    cardHolderName: "",
    cardNumber: "",
    cardExpiry: "",
    cardSecurityCode: ""
}

const defaultNotificationPreferences = {
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false
}

const CANCELLATION_WINDOW_MINUTES = 30

export default function ProfilePage() {
    const userService = useMemo(() => new UserService(), [])
    const paymentService = useMemo(() => new PaymentService(), [])
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const userFromRedux = useSelector(state => state.user.payload)
    const [saving, setSaving] = useState(false)
    const [activeSection, setActiveSection] = useState("profile")
    const [viewMode, setViewMode] = useState("complete")
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [photoSourcePickerOpen, setPhotoSourcePickerOpen] = useState(false)
    const [photoSourcePickerContext, setPhotoSourcePickerContext] = useState("")
    const [cancellingBookingCode, setCancellingBookingCode] = useState("")
    const [security, setSecurity] = useState({
        passwordOtpSent: false,
        passwordOtp: "",
        newPassword: "",
        confirmPassword: "",
        deleteOtpSent: false,
        deleteOtp: ""
    })
    const [adminNotification, setAdminNotification] = useState({
        audience: "ALL",
        email: "",
        subject: "",
        message: ""
    })
    const [profile, setProfile] = useState({
        fullName: userFromRedux?.fullName || "",
        email: userFromRedux?.email || "",
        phone: "",
        preferredCity: "",
        profileImageUrl: "",
        role: getPrimaryRole(userFromRedux),
        verified: false,
        savedPaymentCards: [],
        bookedMovies: [],
        favoriteMovies: [],
        favoriteTheaters: [],
        managedTheaterNames: [],
        theaterManagerRequestStatus: userFromRedux?.theaterManagerRequestStatus || "NONE",
        theaterManagerDeleteAfter: userFromRedux?.theaterManagerDeleteAfter || null,
        theaterManagerRejectionReason: userFromRedux?.theaterManagerRejectionReason || "",
        notificationPreferences: defaultNotificationPreferences,
        walletBalance: 0
    })

    const bookedTickets = useMemo(() => normalizeBookedTickets(profile.bookedMovies).sort((left, right) => {
        return new Date(right.bookedAt || 0).getTime() - new Date(left.bookedAt || 0).getTime()
    }), [profile.bookedMovies])

    const isAdmin = profile.role === "ADMIN"
    const isTheaterManager = profile.role === "THEATER_MANAGER"
    const sectionItems = [
        { id: "profile", label: "Profile", icon: "fa-user" },
        { id: "notifications", label: "Notifications", icon: "fa-bell" },
        { id: "cards", label: "Saved Cards", icon: "fa-credit-card" },
        { id: "wishlist", label: "Wishlist", icon: "fa-heart" },
        { id: "bookings", label: "Bookings", icon: "fa-ticket" },
        { id: "security", label: "Security", icon: "fa-shield-halved" }
    ]

    useEffect(() => {
        userService.getProfile().then(result => {
            applyProfileResult(result.data)
        }).catch(() => toast.error("Could not load your profile.", {
            theme: "dark",
            position: "top-center"
        }))
    }, [userService])

    function applyProfileResult(data) {
        setProfile({
            fullName: data?.fullName || "",
            email: data?.email || "",
            phone: data?.phone || "",
            preferredCity: data?.preferredCity || "",
            profileImageUrl: data?.profileImageUrl || "",
            role: data?.role || "",
            verified: data?.verified || data?.emailVerified || false,
            savedPaymentCards: data?.savedPaymentCards || [],
            bookedMovies: data?.bookedMovies || [],
            favoriteMovies: data?.favoriteMovies || [],
            favoriteTheaters: data?.favoriteTheaters || [],
            managedTheaterNames: data?.managedTheaterNames || [],
            theaterManagerRequestStatus: data?.theaterManagerRequestStatus || "NONE",
            theaterManagerDeleteAfter: data?.theaterManagerDeleteAfter || null,
            theaterManagerRejectionReason: data?.theaterManagerRejectionReason || "",
            notificationPreferences: data?.notificationPreferences || defaultNotificationPreferences,
            walletBalance: data?.walletBalance || 0
        })
        setIsEditingProfile(false)
        setPhotoSourcePickerOpen(false)
        setPhotoSourcePickerContext("")
    }

    function updateField(field, value) {
        setProfile(currentProfile => ({
            ...currentProfile,
            [field]: value
        }))
    }

    function chooseProfileImage(event) {
        if (!isEditingProfile) {
            return
        }
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) {
            return
        }
        if (!file.type.startsWith("image/")) {
            toast.error("Choose an image file for your profile picture.", {
                theme: "dark",
                position: "top-center"
            })
            return
        }
        if (file.size > 1024 * 1024) {
            toast.error("Choose an image under 1 MB.", {
                theme: "dark",
                position: "top-center"
            })
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            updateField("profileImageUrl", String(reader.result || ""))
            setPhotoSourcePickerOpen(false)
            setPhotoSourcePickerContext("")
        }
        reader.onerror = () => toast.error("Could not read that image.", {
            theme: "dark",
            position: "top-center"
        })
        reader.readAsDataURL(file)
    }

    function openProfilePhotoChoices(context = "identity") {
        if (!isEditingProfile) {
            return
        }
        setPhotoSourcePickerOpen(true)
        setPhotoSourcePickerContext(context)
    }

    function chooseProfilePhotoSource(inputId) {
        if (!isEditingProfile) {
            return
        }
        setPhotoSourcePickerOpen(false)
        setPhotoSourcePickerContext("")
        document.getElementById(inputId)?.click()
    }

    function updateNotificationPreference(field, value) {
        setProfile(currentProfile => ({
            ...currentProfile,
            notificationPreferences: {
                ...currentProfile.notificationPreferences,
                [field]: value
            }
        }))
    }

    function updateCard(index, field, value) {
        if (!isEditingProfile) {
            return
        }
        setProfile(currentProfile => ({
            ...currentProfile,
            savedPaymentCards: currentProfile.savedPaymentCards.map((card, cardIndex) =>
                cardIndex === index ? { ...card, [field]: value } : card
            )
        }))
    }

    function addCard() {
        if (!isEditingProfile) {
            return
        }
        if (profile.savedPaymentCards.length >= 5) {
            toast.warning("You can save up to 5 cards.", {
                theme: "dark",
                position: "top-center"
            })
            return
        }
        setProfile(currentProfile => ({
            ...currentProfile,
            savedPaymentCards: [...currentProfile.savedPaymentCards, { ...emptyCard }]
        }))
    }

    function removeCard(index) {
        if (!isEditingProfile) {
            return
        }
        setProfile(currentProfile => ({
            ...currentProfile,
            savedPaymentCards: currentProfile.savedPaymentCards.filter((_, cardIndex) => cardIndex !== index)
        }))
    }

    function saveProfile(event) {
        event?.preventDefault()
        setSaving(true)
        userService.updateProfile({
            fullName: profile.fullName,
            phone: profile.phone,
            preferredCity: profile.preferredCity,
            profileImageUrl: profile.profileImageUrl,
            savedPaymentCards: profile.savedPaymentCards
        }).then(result => {
            const updatedProfile = result.data
            applyProfileResult(updatedProfile)
            dispatch(addUserToState({
                ...userFromRedux,
                fullName: updatedProfile?.fullName || userFromRedux?.fullName,
                email: updatedProfile?.email || userFromRedux?.email
            }))
            toast.success("Profile saved.", {
                theme: "dark",
                position: "top-center"
            })
        }).catch(error => toast.error(error.response?.data?.message || "Could not save profile.", {
            theme: "dark",
            position: "top-center"
        })).finally(() => setSaving(false))
    }

    function cancelProfileEdit() {
        setPhotoSourcePickerOpen(false)
        setPhotoSourcePickerContext("")
        userService.getProfile()
            .then(result => applyProfileResult(result.data))
            .catch(() => setIsEditingProfile(false))
    }

    function saveNotificationPreferences() {
        setSaving(true)
        userService.updateNotificationPreferences(profile.notificationPreferences)
            .then(result => {
                applyProfileResult(result.data)
                toast.success("Notification preferences saved.", {
                    theme: "dark",
                    position: "top-center"
                })
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not save notification preferences.", {
                theme: "dark",
                position: "top-center"
            }))
            .finally(() => setSaving(false))
    }

    function sendAdminNotification(event) {
        event.preventDefault()
        userService.sendAdminNotification(adminNotification)
            .then(result => {
                setAdminNotification({
                    audience: "ALL",
                    email: "",
                    subject: "",
                    message: ""
                })
                toast.success(result.data?.message || "Notification queued.", {
                    theme: "dark",
                    position: "top-center"
                })
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not send notification.", {
                theme: "dark",
                position: "top-center"
            }))
    }

    function updateSecurity(field, value) {
        setSecurity(current => ({
            ...current,
            [field]: value
        }))
    }

    function requestPasswordOtp() {
        userService.requestPasswordResetOtp({ email: profile.email })
            .then(() => {
                updateSecurity("passwordOtpSent", true)
                toast.success("Password change OTP sent to your email.", {
                    theme: "dark",
                    position: "top-center"
                })
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not send password OTP.", {
                theme: "dark",
                position: "top-center"
            }))
    }

    function changePassword() {
        if (security.newPassword !== security.confirmPassword) {
            toast.error("Passwords do not match.", {
                theme: "dark",
                position: "top-center"
            })
            return
        }

        userService.resetPassword({
            email: profile.email,
            otp: security.passwordOtp.replace(/\D/g, "").slice(0, 6),
            newPassword: security.newPassword
        }).then(() => {
            setSecurity(current => ({
                ...current,
                passwordOtpSent: false,
                passwordOtp: "",
                newPassword: "",
                confirmPassword: ""
            }))
            toast.success("Password changed. Use the new password next time you sign in.", {
                theme: "dark",
                position: "top-center"
            })
        }).catch(error => toast.error(error.response?.data?.message || "Could not change password.", {
            theme: "dark",
            position: "top-center"
        }))
    }

    function requestDeleteOtp() {
        userService.requestAccountDeleteOtp()
            .then(() => {
                updateSecurity("deleteOtpSent", true)
                toast.success("Deletion OTP sent to your email.", {
                    theme: "dark",
                    position: "top-center"
                })
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not send deletion OTP.", {
                theme: "dark",
                position: "top-center"
            }))
    }

    function deleteOwnAccount() {
        if (!window.confirm("Delete your CineSaga account and related ticket records permanently?")) {
            return
        }

        userService.confirmAccountDeleteOtp(security.deleteOtp.replace(/\D/g, "").slice(0, 6))
            .then(() => {
                sessionStorage.removeItem("lastBooking")
                sessionStorage.removeItem("lastBookingUserEmail")
                dispatch(removeUserFromState())
                navigate("/")
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not delete your account.", {
                theme: "dark",
                position: "top-center"
            }))
    }

    function maskEmail(email) {
        if (!email || !email.includes("@")) {
            return email
        }
        const [localPart, domain] = email.split("@")
        return `${localPart.slice(0, Math.min(3, localPart.length))}***${localPart.length > 5 ? localPart.slice(-2) : ""}@${domain}`
    }

    function isConfirmedTicket(bookedMovie) {
        return String(bookedMovie?.status || "CONFIRMED").toUpperCase() === "CONFIRMED"
    }

    function canDownloadTicket(bookedMovie) {
        const bookedAt = new Date(bookedMovie?.bookedAt).getTime()
        return isConfirmedTicket(bookedMovie) && Number.isFinite(bookedAt) && Date.now() - bookedAt <= 24 * 60 * 60 * 1000
    }

    function canCancelTicket(bookedMovie) {
        const bookedAt = new Date(bookedMovie?.bookedAt).getTime()
        return isConfirmedTicket(bookedMovie)
            && Number.isFinite(bookedAt)
            && Date.now() - bookedAt <= CANCELLATION_WINDOW_MINUTES * 60 * 1000
    }

    function downloadProfileTicket(bookedMovie) {
        downloadTicketImage(toTicketImageBooking(bookedMovie), maskEmail(profile.email))
    }

    function cancelProfileTicket(bookedMovie) {
        const bookingCode = getTicketCode(bookedMovie)
        if (!bookingCode || !isConfirmedTicket(bookedMovie)) {
            return
        }
        if (!window.confirm("Cancel this ticket and release the booked seats?")) {
            return
        }

        setCancellingBookingCode(bookingCode)
        paymentService.cancelTicket(bookingCode)
            .then(() => userService.getProfile())
            .then(result => {
                applyProfileResult(result.data)
                toast.success("Ticket cancelled successfully.", {
                    theme: "dark",
                    position: "top-center"
                })
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not cancel this ticket.", {
                theme: "dark",
                position: "top-center"
            }))
            .finally(() => setCancellingBookingCode(""))
    }

    function removeFavoriteMovie(movieId) {
        userService.removeFavoriteMovie(movieId)
            .then(result => {
                setProfile(currentProfile => ({
                    ...currentProfile,
                    favoriteMovies: result.data?.favoriteMovies || []
                }))
                toast.success("Removed from wishlist.", {
                    theme: "dark",
                    position: "top-center"
                })
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not remove wishlist movie.", {
                theme: "dark",
                position: "top-center"
            }))
    }

    function removeFavoriteTheater(theaterName) {
        userService.removeFavoriteTheater(theaterName)
            .then(result => {
                setProfile(currentProfile => ({
                    ...currentProfile,
                    favoriteTheaters: result.data?.favoriteTheaters || []
                }))
                toast.success("Removed theatre from wishlist.", {
                    theme: "dark",
                    position: "top-center"
                })
            })
            .catch(error => toast.error(error.response?.data?.message || "Could not remove wishlist theatre.", {
                theme: "dark",
                position: "top-center"
            }))
    }

    function toTicketImageBooking(bookedMovie) {
        return {
            bookingCode: getTicketCode(bookedMovie),
            movieName: getTicketMovieName(bookedMovie),
            saloonName: getTicketTheaterName(bookedMovie),
            movieDay: bookedMovie?.movieDay,
            movieStartTime: bookedMovie?.showtimeStartTime || bookedMovie?.movieStartTime,
            chairNumbers: getTicketSeats(bookedMovie),
            totalAmount: bookedMovie?.totalAmount,
            recipientEmail: profile.email,
            qrCodePayload: bookedMovie?.qrCodePayload
        }
    }

    function ticketAvailabilityText(bookedMovie) {
        const bookedAt = new Date(bookedMovie?.bookedAt).getTime()
        if (!Number.isFinite(bookedAt)) {
            return "Download unavailable"
        }
        const remainingMs = (24 * 60 * 60 * 1000) - (Date.now() - bookedAt)
        if (remainingMs <= 0) {
            return "Download expired"
        }
        const hours = Math.floor(remainingMs / (60 * 60 * 1000))
        const minutes = Math.max(1, Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)))
        return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`
    }

    function ticketCancellationText(bookedMovie) {
        if (!isConfirmedTicket(bookedMovie)) {
            return "Cancelled ticket"
        }
        const bookedAt = new Date(bookedMovie?.bookedAt).getTime()
        if (!Number.isFinite(bookedAt)) {
            return "Cancellation unavailable"
        }
        const remainingMs = (CANCELLATION_WINDOW_MINUTES * 60 * 1000) - (Date.now() - bookedAt)
        if (remainingMs <= 0) {
            return "Cancellation window expired"
        }
        const minutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)))
        return `${minutes}m left to cancel`
    }

    function renderSummaryGrid() {
        return (
            <div className='profile-summary-grid'>
                <div>
                    <span>Role</span>
                    <strong>{formatRoleWithRequest(profile)}</strong>
                </div>
                <div>
                    <span>Email</span>
                    <strong>{maskEmail(profile.email)}</strong>
                </div>
                <div>
                    <span>Status</span>
                    <strong>{profile.verified ? "Verified" : "Pending"}</strong>
                </div>
                <div>
                    <span>Bookings</span>
                    <strong>{profile.bookedMovies.length}</strong>
                </div>
                <div>
                    <span>Wishlist</span>
                    <strong>{profile.favoriteMovies.length + profile.favoriteTheaters.length}</strong>
                </div>
                <div>
                    <span>Saved Cards</span>
                    <strong>{profile.savedPaymentCards.length}</strong>
                </div>
                {isTheaterManager ? (
                    <div className='profile-summary-wide'>
                        <span>Assigned Theatres</span>
                        <strong>{profile.managedTheaterNames.join(", ") || "Pending"}</strong>
                    </div>
                ) : null}
                {profile.theaterManagerRequestStatus === "PENDING" ? (
                    <div className='profile-summary-wide'>
                        <span>Theatre Manager Request</span>
                        <strong>Wait for admin approval</strong>
                    </div>
                ) : null}
                {profile.theaterManagerRequestStatus === "REJECTED" ? (
                    <div className='profile-summary-wide'>
                        <span>Theatre Manager Request</span>
                        <strong>{profile.theaterManagerRejectionReason || "Rejected"}{profile.theaterManagerDeleteAfter ? ` - Account deletion after ${new Date(profile.theaterManagerDeleteAfter).toLocaleString()}` : ""}</strong>
                    </div>
                ) : null}
            </div>
        )
    }

    function renderNotificationsSection() {
        return (
            <section className='profile-panel profile-notifications-panel'>
                <div className='profile-panel-header'>
                    <div>
                        <p className='booking-kicker'>Notifications</p>
                        <h3>{isAdmin ? "Send Notification" : "Notification Preferences"}</h3>
                    </div>
                </div>

                {isAdmin ? (
                    <form className='admin-notification-form' onSubmit={sendAdminNotification}>
                        <div className='row'>
                            <div className='col-md-6'>
                                <div className='form-floating mb-3'>
                                    <select className='form-select' id='adminNotificationAudience' value={adminNotification.audience}
                                        onChange={event => setAdminNotification(current => ({ ...current, audience: event.target.value }))}>
                                        <option value='ALL'>All users</option>
                                        <option value='CUSTOMERS'>Customers</option>
                                        <option value='THEATER_MANAGERS'>Theatre managers</option>
                                        <option value='ADMINS'>Admins</option>
                                        <option value='SPECIFIC'>Specific email</option>
                                    </select>
                                    <label htmlFor='adminNotificationAudience'>Send To</label>
                                </div>
                            </div>
                            <div className='col-md-6'>
                                <div className='form-floating mb-3'>
                                    <input className='form-control' id='adminNotificationEmail' type='email' placeholder='Email'
                                        value={adminNotification.email}
                                        disabled={adminNotification.audience !== "SPECIFIC"}
                                        onChange={event => setAdminNotification(current => ({ ...current, email: event.target.value }))} />
                                    <label htmlFor='adminNotificationEmail'>Specific Email</label>
                                </div>
                            </div>
                        </div>
                        <div className='form-floating mb-3'>
                            <input className='form-control' id='adminNotificationSubject' placeholder='Subject' value={adminNotification.subject}
                                onChange={event => setAdminNotification(current => ({ ...current, subject: event.target.value }))} required />
                            <label htmlFor='adminNotificationSubject'>Subject</label>
                        </div>
                        <div className='form-floating mb-3'>
                            <textarea className='form-control profile-message-box' id='adminNotificationMessage' placeholder='Message' value={adminNotification.message}
                                onChange={event => setAdminNotification(current => ({ ...current, message: event.target.value }))} required />
                            <label htmlFor='adminNotificationMessage'>Message</label>
                        </div>
                        <button type='submit' className='btn btn-dark'>Send Notification</button>
                    </form>
                ) : (
                    <div className='notification-preference-list'>
                        <label className='notification-toggle'>
                            <input type='checkbox' checked={!!profile.notificationPreferences.emailEnabled}
                                onChange={event => updateNotificationPreference("emailEnabled", event.target.checked)} />
                            <span>Email notifications</span>
                        </label>
                        <label className='notification-toggle'>
                            <input type='checkbox' checked={!!profile.notificationPreferences.smsEnabled}
                                onChange={event => updateNotificationPreference("smsEnabled", event.target.checked)} />
                            <span>SMS notifications</span>
                        </label>
                        <label className='notification-toggle'>
                            <input type='checkbox' checked={!!profile.notificationPreferences.whatsappEnabled}
                                onChange={event => updateNotificationPreference("whatsappEnabled", event.target.checked)} />
                            <span>WhatsApp notifications</span>
                        </label>
                        <button type='button' className='btn btn-dark' disabled={saving} onClick={saveNotificationPreferences}>
                            {saving ? "Saving..." : "Save Preferences"}
                        </button>
                    </div>
                )}
            </section>
        )
    }

    function renderProfileSection() {
        return (
            <section className='profile-panel profile-details-panel profile-combined-panel'>
                <div className='profile-panel-header'>
                    <div>
                        <p className='booking-kicker'>Profile</p>
                        <h3>Account Details</h3>
                    </div>
                    {viewMode === "split" ? renderEditProfileButton() : null}
                </div>
                {renderSummaryGrid()}
                <div className='profile-picture-editor'>
                    <div className='profile-avatar-preview'>
                        {profile.profileImageUrl ? (
                            <img src={profile.profileImageUrl} alt={profile.fullName || "Profile"} />
                        ) : (
                            <span>{getInitials(profile.fullName)}</span>
                        )}
                    </div>
                    <div className='profile-picture-actions'>
                        <strong>Profile Picture</strong>
                        <span>{isEditingProfile ? "Choose a new profile photo or take one from the camera." : "Choose Edit profile before changing your photo."}</span>
                        {isEditingProfile ? (
                        <div>
                            <input id='profileImageUpload' className='visually-hidden' type='file' accept='image/*' onChange={chooseProfileImage} />
                            <input id='profileImageCapture' className='visually-hidden' type='file' accept='image/*' capture='user' onChange={chooseProfileImage} />
                            <button type='button' className='btn btn-outline-dark' onClick={() => openProfilePhotoChoices("details")}>
                                <i className='fa-solid fa-camera me-2'></i>Change photo
                            </button>
                            {profile.profileImageUrl ? (
                                <button type='button' className='btn btn-outline-danger' onClick={() => updateField("profileImageUrl", "")}>
                                    Remove
                                </button>
                            ) : null}
                        </div>
                        ) : null}
                    </div>
                </div>
                <div className='form-floating mb-3'>
                    <input className='form-control' id='profileFullName' placeholder='Full Name' value={profile.fullName}
                        disabled={!isEditingProfile} onChange={event => updateField("fullName", event.target.value)} required />
                    <label htmlFor='profileFullName'>Full Name</label>
                </div>
                <div className='form-floating mb-3'>
                    <input className='form-control' id='profileEmail' placeholder='Email' value={profile.email} disabled />
                    <label htmlFor='profileEmail'>Email</label>
                </div>
                <div className='form-floating mb-3'>
                    <input className='form-control' id='profilePhone' placeholder='Phone' value={profile.phone || ""}
                        disabled={!isEditingProfile} onChange={event => updateField("phone", event.target.value)} />
                    <label htmlFor='profilePhone'>Phone</label>
                </div>
                <div className='form-floating'>
                    <input className='form-control' id='profileCity' placeholder='Preferred City' value={profile.preferredCity || ""}
                        disabled={!isEditingProfile} onChange={event => updateField("preferredCity", event.target.value)} />
                    <label htmlFor='profileCity'>Preferred City</label>
                </div>
            </section>
        )
    }

    function renderCardsSection() {
        return (
            <section className='profile-panel profile-security-panel'>
                <div className='profile-panel-header'>
                    <div>
                        <p className='booking-kicker'>Checkout</p>
                        <h3>Saved Cards</h3>
                    </div>
                    {isEditingProfile ? (
                        <button type='button' className='btn btn-outline-dark' onClick={addCard}>Add Card</button>
                    ) : null}
                </div>

                <div className='saved-card-list'>
                    {profile.savedPaymentCards.length === 0 ? (
                        <p className='profile-muted text-start'>No cards saved yet.</p>
                    ) : profile.savedPaymentCards.map((card, index) => (
                        <div className='saved-card-editor' key={card.cardId || index}>
                            <div className='saved-card-editor-header'>
                                <strong>{card.maskedCardNumber || "New card"}</strong>
                                {isEditingProfile ? (
                                    <button type='button' className='icon-button' onClick={() => removeCard(index)} aria-label='Remove card'>
                                        <i className='fa-solid fa-xmark'></i>
                                    </button>
                                ) : null}
                            </div>
                            <div className='row'>
                                <div className='col-md-6'>
                                    <div className='form-floating mb-3'>
                                        <input className='form-control' id={`cardNickname${index}`} placeholder='Nickname' value={card.nickname || ""} disabled={!isEditingProfile}
                                            onChange={event => updateCard(index, "nickname", event.target.value)} />
                                        <label htmlFor={`cardNickname${index}`}>Nickname</label>
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div className='form-floating mb-3'>
                                        <input className='form-control' id={`cardHolder${index}`} placeholder='Card Holder Name' value={card.cardHolderName || ""} disabled={!isEditingProfile}
                                            onChange={event => updateCard(index, "cardHolderName", event.target.value)} />
                                        <label htmlFor={`cardHolder${index}`}>Card Holder Name</label>
                                    </div>
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col-lg-7'>
                                    <div className='form-floating mb-3'>
                                        <Cleave className='form-control' id={`cardNumber${index}`} placeholder='Card Number' value={card.cardNumber || ""} disabled={!isEditingProfile}
                                            onChange={event => updateCard(index, "cardNumber", event.target.value)}
                                            options={{ creditCard: true }} />
                                        <label htmlFor={`cardNumber${index}`}>Card Number</label>
                                    </div>
                                </div>
                                <div className='col-sm-6 col-lg-3'>
                                    <div className='form-floating mb-3'>
                                        <Cleave className='form-control' id={`cardExpiry${index}`} placeholder='Expiry' value={card.cardExpiry || ""} disabled={!isEditingProfile}
                                            onChange={event => updateCard(index, "cardExpiry", event.target.value)}
                                            options={{ date: true, datePattern: ['m', 'y'] }} />
                                        <label htmlFor={`cardExpiry${index}`}>Expiry</label>
                                    </div>
                                </div>
                                <div className='col-sm-6 col-lg-2'>
                                    <div className='form-floating mb-3'>
                                        <input className='form-control' id={`cardSecurityCode${index}`} type='password' inputMode='numeric' maxLength='4' placeholder='CVV' value={card.cardSecurityCode || ""} disabled={!isEditingProfile}
                                            onChange={event => updateCard(index, "cardSecurityCode", event.target.value.replace(/\D/g, "").slice(0, 4))} />
                                        <label htmlFor={`cardSecurityCode${index}`}>CVV</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    function renderWishlistSection() {
        return (
            <section className='profile-panel profile-favorites-panel'>
                <div className='profile-panel-header'>
                    <div>
                        <p className='booking-kicker'>Wishlist</p>
                        <h3>Wishlist Movies</h3>
                    </div>
                    <span className='wishlist-count-pill'>{profile.favoriteMovies.length} saved</span>
                </div>

                <div className='profile-wishlist-intro'>
                    <i className='fa-solid fa-heart'></i>
                    <span>Movies you marked for later will stay here for quick booking.</span>
                </div>

                <div className='profile-favorite-list profile-wishlist-list'>
                    {profile.favoriteMovies.length === 0 ? (
                        <div className='profile-wishlist-empty'>
                            <i className='fa-regular fa-heart'></i>
                            <p>No wishlist movies yet. Open a movie and tap Wishlist.</p>
                        </div>
                    ) : profile.favoriteMovies.map(movie => (
                        <article className='profile-favorite-card' key={movie.movieId}>
                            <div className='profile-favorite-poster'>
                                {movie.movieImageUrl ? <img src={movie.movieImageUrl} alt={movie.movieName} /> : <i className='fa-solid fa-film'></i>}
                            </div>
                            <div>
                                <h4>{movie.movieName}</h4>
                                <p>{movie.addedAt ? `Added ${new Date(movie.addedAt).toLocaleDateString()}` : "Favorite movie"}</p>
                            </div>
                            <div className='profile-favorite-actions'>
                                <button type='button' className='btn btn-outline-dark' onClick={() => navigate("/movie/" + movie.movieId)}>View</button>
                                <button type='button' className='btn btn-outline-danger' onClick={() => removeFavoriteMovie(movie.movieId)}>Remove</button>
                            </div>
                        </article>
                    ))}
                </div>

                <div className='profile-wishlist-subsection'>
                    <div className='profile-panel-header compact'>
                        <div>
                            <p className='booking-kicker'>Theatres</p>
                            <h3>Wishlist Theatres</h3>
                        </div>
                        <span className='wishlist-count-pill'>{profile.favoriteTheaters.length} saved</span>
                    </div>
                    <div className='profile-favorite-list profile-theater-wishlist-list'>
                        {profile.favoriteTheaters.length === 0 ? (
                            <div className='profile-wishlist-empty'>
                                <i className='fa-regular fa-building'></i>
                                <p>No wishlist theatres yet. Open a movie, choose a city, and tap the heart beside a theatre.</p>
                            </div>
                        ) : profile.favoriteTheaters.map(theater => (
                            <article className='profile-favorite-card' key={theater.theaterName}>
                                <div className='profile-favorite-poster'>
                                    <i className='fa-solid fa-clapperboard'></i>
                                </div>
                                <div>
                                    <h4>{theater.theaterName}</h4>
                                    <p>{theater.cityName || "Favourite theatre"}</p>
                                </div>
                                <div className='profile-favorite-actions'>
                                    <button type='button' className='btn btn-outline-danger' onClick={() => removeFavoriteTheater(theater.theaterName)}>Remove</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    function renderBookingsSection() {
        return (
            <section className='profile-panel profile-tickets-panel'>
                <div className='profile-panel-header'>
                    <div>
                        <p className='booking-kicker'>History</p>
                        <h3>Booking History</h3>
                    </div>
                </div>

                <div className='profile-ticket-list'>
                    {bookedTickets.length === 0 ? (
                        <div className='profile-ticket-empty'>
                            <i className='fa-solid fa-ticket'></i>
                            <h4>No ticket is booked</h4>
                            <p>Your booked tickets will appear here after checkout. Cancellation controls appear on active bookings.</p>
                        </div>
                    ) : bookedTickets.map((ticket, ticketIndex) => {
                        const downloadable = canDownloadTicket(ticket)
                        const cancellable = canCancelTicket(ticket)
                        const bookingCode = getTicketCode(ticket)
                        return (
                            <div className='profile-ticket-card' key={bookingCode || ticketIndex}>
                                <div className='profile-ticket-main'>
                                    <div>
                                        <span className='ticket-status-pill'>{ticket.status || "CONFIRMED"}</span>
                                        <h4>{getTicketMovieName(ticket)}</h4>
                                        <p>{getTicketTheaterName(ticket) || "-"}</p>
                                    </div>
                                    <strong>{bookingCode || "No code"}</strong>
                                </div>
                                <div className='profile-ticket-details'>
                                    <span>Date <strong>{ticket.movieDay || "-"}</strong></span>
                                    <span>Time <strong>{ticket.showtimeStartTime || ticket.movieStartTime || "-"}</strong></span>
                                    <span>Seats <strong>{getTicketSeats(ticket) || "-"}</strong></span>
                                    <span>Total <strong>{formatCurrency(ticket.totalAmount)}</strong></span>
                                </div>
                                <div className='profile-ticket-actions'>
                                    <span>{ticketAvailabilityText(ticket)} - {ticketCancellationText(ticket)}</span>
                                    <div className='profile-ticket-action-buttons'>
                                        {downloadable ? (
                                            <button type='button' className='btn btn-dark' onClick={() => downloadProfileTicket(ticket)}>
                                                <i className='fa-solid fa-download me-2'></i>Download Ticket
                                            </button>
                                        ) : null}
                                        {cancellable ? (
                                            <button type='button' className='btn btn-outline-danger'
                                                disabled={!bookingCode || cancellingBookingCode === bookingCode}
                                                onClick={() => cancelProfileTicket(ticket)}>
                                                <i className='fa-solid fa-ban me-2'></i>
                                                {cancellingBookingCode === bookingCode ? "Cancelling..." : "Cancel Ticket"}
                                            </button>
                                        ) : (
                                            <span className='ticket-cancelled-note'>{ticketCancellationText(ticket)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        )
    }

    function renderSecuritySection() {
        return (
            <section className='profile-panel profile-account-panel'>
                <div className='profile-panel-header'>
                    <div>
                        <p className='booking-kicker'>Security</p>
                        <h3>Password & Account</h3>
                    </div>
                </div>

                <div className='security-section'>
                    <div className='security-section-header'>
                        <div>
                            <strong>Change Password</strong>
                            <span>We will send an OTP to {maskEmail(profile.email)}.</span>
                        </div>
                        <button type='button' className='btn btn-outline-dark' onClick={requestPasswordOtp}>Send OTP</button>
                    </div>
                    {security.passwordOtpSent ? (
                        <div className='security-input-grid'>
                            <div className='form-floating'>
                                <input className='form-control' id='passwordOtp' placeholder='OTP' inputMode='numeric' maxLength='6'
                                    value={security.passwordOtp} onChange={event => updateSecurity("passwordOtp", event.target.value.replace(/\D/g, ""))} />
                                <label htmlFor='passwordOtp'>OTP</label>
                            </div>
                            <div className='form-floating'>
                                <input className='form-control' id='newProfilePassword' type='password' placeholder='New Password'
                                    value={security.newPassword} onChange={event => updateSecurity("newPassword", event.target.value)} />
                                <label htmlFor='newProfilePassword'>New Password</label>
                            </div>
                            <div className='form-floating'>
                                <input className='form-control' id='confirmProfilePassword' type='password' placeholder='Confirm Password'
                                    value={security.confirmPassword} onChange={event => updateSecurity("confirmPassword", event.target.value)} />
                                <label htmlFor='confirmProfilePassword'>Confirm Password</label>
                            </div>
                            <button type='button' className='btn btn-dark' onClick={changePassword}>Update Password</button>
                        </div>
                    ) : null}
                </div>

                <div className='security-section danger-zone'>
                    <div className='security-section-header'>
                        <div>
                            <strong>Delete Account</strong>
                            <span>Deletes your profile plus related ticket, payment, and review records.</span>
                        </div>
                        <button type='button' className='btn btn-outline-danger' onClick={requestDeleteOtp}>Send Delete OTP</button>
                    </div>
                    {security.deleteOtpSent ? (
                        <div className='security-input-grid compact'>
                            <div className='form-floating'>
                                <input className='form-control' id='deleteOtp' placeholder='Deletion OTP' inputMode='numeric' maxLength='6'
                                    value={security.deleteOtp} onChange={event => updateSecurity("deleteOtp", event.target.value.replace(/\D/g, ""))} />
                                <label htmlFor='deleteOtp'>Deletion OTP</label>
                            </div>
                            <button type='button' className='btn btn-danger' onClick={deleteOwnAccount}>Delete My Account</button>
                        </div>
                    ) : null}
                </div>
            </section>
        )
    }

    function renderCompleteSection() {
        return (
            <div className='profile-complete-stack'>
                {renderProfileIdentitySection()}
                {renderProfileSection()}
                {renderNotificationsSection()}
                {renderCardsSection()}
                {renderWishlistSection()}
                {renderBookingsSection()}
                {renderSecuritySection()}
            </div>
        )
    }

    function renderProfileIdentitySection() {
        return (
            <section className='profile-panel profile-identity-panel'>
                <div className='profile-identity-main'>
                    <button type='button' className={`profile-identity-avatar ${isEditingProfile ? "editable" : ""}`}
                        onClick={() => openProfilePhotoChoices("identity")}
                        aria-label='Profile picture'>
                        {profile.profileImageUrl ? (
                            <img src={profile.profileImageUrl} alt={profile.fullName || "Profile"} />
                        ) : (
                            <span>{getInitials(profile.fullName)}</span>
                        )}
                        {isEditingProfile ? <i className='fa-solid fa-camera'></i> : null}
                    </button>
                    {isEditingProfile ? (
                        <>
                            <input id='profileIdentityImageUpload' className='visually-hidden' type='file' accept='image/*' onChange={chooseProfileImage} />
                            <input id='profileIdentityImageCapture' className='visually-hidden' type='file' accept='image/*' capture='user' onChange={chooseProfileImage} />
                        </>
                    ) : null}
                    <div>
                        <p className='booking-kicker'>Profile</p>
                        <h3>{profile.fullName || "CineSaga User"}</h3>
                        <p>{formatRoleWithRequest(profile)} - {maskEmail(profile.email)}</p>
                    </div>
                </div>
                {renderEditProfileButton()}
            </section>
        )
    }

    function renderEditProfileButton() {
        return isEditingProfile ? (
            <button type='button' className='btn btn-outline-dark profile-edit-button' onClick={cancelProfileEdit}>
                <i className='fa-solid fa-xmark me-2'></i>Cancel edit
            </button>
        ) : (
            <button type='button' className='btn btn-outline-dark profile-edit-button' onClick={() => setIsEditingProfile(true)}>
                <i className='fa-solid fa-pen me-2'></i>Edit profile
            </button>
        )
    }

    function renderLayoutToggle() {
        return (
            <button type='button' className='profile-layout-toggle'
                onClick={() => setViewMode(viewMode === "complete" ? "split" : "complete")}>
                <i className={`fa-solid ${viewMode === "complete" ? "fa-table-columns" : "fa-id-card"}`}></i>
                <span>{viewMode === "complete" ? "Split Profile" : "Complete Profile"}</span>
            </button>
        )
    }

    function renderActiveSection() {
        switch (activeSection) {
            case "notifications":
                return renderNotificationsSection()
            case "profile":
                return renderProfileSection()
            case "cards":
                return renderCardsSection()
            case "wishlist":
                return renderWishlistSection()
            case "bookings":
                return renderBookingsSection()
            case "security":
                return renderSecuritySection()
            default:
                return renderProfileSection()
        }
    }

    const showSaveAction = isEditingProfile && (viewMode === "complete" || activeSection === "profile" || activeSection === "cards")

    return (
        <div className={`profile-page booking-shell ${viewMode === "complete" ? "profile-complete-view" : "profile-split-view"} ${isEditingProfile ? "editing-profile" : ""}`}>
            <div className='container profile-container'>
                <div className='profile-header text-start'>
                    <div className='profile-header-copy'>
                        <p className='booking-kicker'>Account</p>
                        <h2>Welcome, {profile.fullName || "CineSaga User"}</h2>
                    <p>{formatRoleWithRequest(profile)} dashboard for contact details, checkout preferences, security, and CineSaga activity.</p>
                    </div>
                    {renderLayoutToggle()}
                </div>

                {viewMode === "complete" ? (
                    <div className='profile-complete-surface'>
                        {renderCompleteSection()}
                        {showSaveAction ? (
                            <div className='profile-actions floating-save'>
                                <button type='button' className='btn btn-dark' disabled={saving} onClick={saveProfile}>
                                    <i className='fa-solid fa-floppy-disk me-2'></i>{saving ? "Saving..." : "Save profile"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : (
                <div className='profile-dashboard-layout'>
                    <aside className='profile-sidebar' aria-label='Profile sections'>
                        <div className='profile-sidebar-brand'>
                            <strong>CineSaga</strong>
                            <span>{formatRoleWithRequest(profile)}</span>
                        </div>
                        <nav>
                            {sectionItems.map(section => (
                                <button type='button'
                                    className={`profile-sidebar-link ${activeSection === section.id ? "active" : ""}`}
                                    key={section.id}
                                    onClick={() => {
                                        setActiveSection(section.id)
                                        setViewMode("split")
                                    }}>
                                    <i className={`fa-solid ${section.icon}`}></i>
                                    <span>{section.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <div className='profile-section-surface'>
                        {renderActiveSection()}
                        {showSaveAction ? (
                            <div className='profile-actions'>
                                <button type='button' className='btn btn-dark' disabled={saving} onClick={saveProfile}>
                                    <i className='fa-solid fa-floppy-disk me-2'></i>{saving ? "Saving..." : "Save profile"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
                )}
            </div>
            {renderPhotoChoiceDialog()}
            <ToastContainer />
        </div>
    )

    function renderPhotoChoiceDialog() {
        if (!photoSourcePickerOpen) {
            return null
        }
        const uploadInputId = photoSourcePickerContext === "identity" ? "profileIdentityImageUpload" : "profileImageUpload"
        const captureInputId = photoSourcePickerContext === "identity" ? "profileIdentityImageCapture" : "profileImageCapture"
        const closeDialog = () => {
            setPhotoSourcePickerOpen(false)
            setPhotoSourcePickerContext("")
        }
        return (
            <div className='profile-photo-modal-backdrop' role='presentation' onMouseDown={event => {
                if (event.target === event.currentTarget) {
                    closeDialog()
                }
            }}>
                <div className='profile-photo-modal' role='dialog' aria-modal='true' aria-labelledby='profilePhotoDialogTitle'>
                    <button type='button' className='profile-photo-modal-close' aria-label='Close profile photo options' onClick={closeDialog}>
                        <i className='fa-solid fa-xmark'></i>
                    </button>
                    <p className='booking-kicker'>Profile Picture</p>
                    <h3 id='profilePhotoDialogTitle'>Update profile photo</h3>
                    <p>Choose a photo from your device or take a new one with the camera.</p>
                    <div className='profile-photo-modal-actions'>
                        <button type='button' className='btn btn-outline-dark' onClick={() => chooseProfilePhotoSource(uploadInputId)}>
                            <i className='fa-solid fa-image me-2'></i>Choose from device
                        </button>
                        <button type='button' className='btn btn-dark' onClick={() => chooseProfilePhotoSource(captureInputId)}>
                            <i className='fa-solid fa-camera me-2'></i>Take photo
                        </button>
                    </div>
                </div>
            </div>
        )
    }
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

function getPrimaryRole(user) {
    if (user?.roles?.some(role => role === "ADMIN" || role === "ROLE_ADMIN")) {
        return "ADMIN"
    }
    if (user?.roles?.some(role => role === "THEATER_MANAGER" || role === "ROLE_THEATER_MANAGER")) {
        return "THEATER_MANAGER"
    }
    return ""
}

function formatRole(role) {
    if (role === "ADMIN") {
        return "Super Admin"
    }
    if (role === "THEATER_MANAGER") {
        return "Theater Manager"
    }
    return "Customer"
}

function formatRoleWithRequest(profile) {
    if (profile?.theaterManagerRequestStatus === "PENDING") {
        return "Theater Manager - Pending Approval"
    }
    if (profile?.theaterManagerRequestStatus === "REJECTED") {
        return "Theater Manager - Rejected"
    }
    return formatRole(profile?.role)
}

function getInitials(fullName) {
    const parts = String(fullName || "CS").trim().split(/\s+/).filter(Boolean)
    return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "CS"
}

function formatCurrency(value) {
    return `INR ${Number(value || 0).toFixed(2)}`
}
