import Cleave from 'cleave.js/react'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast, ToastContainer } from 'react-toastify'
import { UserService } from '../services/userService'
import { addUserToState } from '../store/actions/userActions'

const emptyCard = {
    cardId: "",
    nickname: "",
    cardHolderName: "",
    cardNumber: "",
    cardExpiry: ""
}

export default function ProfilePage() {
    const userService = useMemo(() => new UserService(), [])
    const dispatch = useDispatch()
    const userFromRedux = useSelector(state => state.user.payload)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState({
        fullName: userFromRedux?.fullName || "",
        email: userFromRedux?.email || "",
        phone: "",
        preferredCity: "",
        savedPaymentCards: []
    })

    useEffect(() => {
        userService.getProfile().then(result => {
            setProfile({
                fullName: result.data?.fullName || "",
                email: result.data?.email || "",
                phone: result.data?.phone || "",
                preferredCity: result.data?.preferredCity || "",
                savedPaymentCards: result.data?.savedPaymentCards || []
            })
        }).catch(() => toast.error("Could not load your profile.", {
            theme: "dark",
            position: "top-center"
        }))
    }, [userService])

    function updateField(field, value) {
        setProfile(currentProfile => ({
            ...currentProfile,
            [field]: value
        }))
    }

    function updateCard(index, field, value) {
        setProfile(currentProfile => ({
            ...currentProfile,
            savedPaymentCards: currentProfile.savedPaymentCards.map((card, cardIndex) =>
                cardIndex === index ? { ...card, [field]: value } : card
            )
        }))
    }

    function addCard() {
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
        setProfile(currentProfile => ({
            ...currentProfile,
            savedPaymentCards: currentProfile.savedPaymentCards.filter((_, cardIndex) => cardIndex !== index)
        }))
    }

    function saveProfile(event) {
        event.preventDefault()
        setSaving(true)
        userService.updateProfile({
            fullName: profile.fullName,
            phone: profile.phone,
            preferredCity: profile.preferredCity,
            savedPaymentCards: profile.savedPaymentCards
        }).then(result => {
            const updatedProfile = result.data
            setProfile({
                fullName: updatedProfile?.fullName || "",
                email: updatedProfile?.email || "",
                phone: updatedProfile?.phone || "",
                preferredCity: updatedProfile?.preferredCity || "",
                savedPaymentCards: updatedProfile?.savedPaymentCards || []
            })
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

    return (
        <div className='profile-page booking-shell'>
            <div className='container profile-container'>
                <div className='profile-header text-start'>
                    <p className='booking-kicker'>Account</p>
                    <h2>Your Profile</h2>
                    <p>Save contact information and reusable demo card details for faster CineSaga checkout.</p>
                </div>

                <form className='profile-grid' onSubmit={saveProfile}>
                    <section className='profile-panel'>
                        <div className='profile-panel-header'>
                            <div>
                                <p className='booking-kicker'>Details</p>
                                <h3>Personal Info</h3>
                            </div>
                        </div>
                        <div className='form-floating mb-3'>
                            <input className='form-control' id='profileFullName' value={profile.fullName}
                                onChange={event => updateField("fullName", event.target.value)} required />
                            <label htmlFor='profileFullName'>Full Name</label>
                        </div>
                        <div className='form-floating mb-3'>
                            <input className='form-control' id='profileEmail' value={profile.email} disabled />
                            <label htmlFor='profileEmail'>Email</label>
                        </div>
                        <div className='form-floating mb-3'>
                            <input className='form-control' id='profilePhone' value={profile.phone || ""}
                                onChange={event => updateField("phone", event.target.value)} />
                            <label htmlFor='profilePhone'>Phone</label>
                        </div>
                        <div className='form-floating'>
                            <input className='form-control' id='profileCity' value={profile.preferredCity || ""}
                                onChange={event => updateField("preferredCity", event.target.value)} />
                            <label htmlFor='profileCity'>Preferred City</label>
                        </div>
                    </section>

                    <section className='profile-panel'>
                        <div className='profile-panel-header'>
                            <div>
                                <p className='booking-kicker'>Checkout</p>
                                <h3>Saved Cards</h3>
                            </div>
                            <button type='button' className='btn btn-outline-dark' onClick={addCard}>Add Card</button>
                        </div>

                        <div className='saved-card-list'>
                            {profile.savedPaymentCards.length === 0 ? (
                                <p className='profile-muted text-start'>No cards saved yet.</p>
                            ) : profile.savedPaymentCards.map((card, index) => (
                                <div className='saved-card-editor' key={card.cardId || index}>
                                    <div className='saved-card-editor-header'>
                                        <strong>{card.maskedCardNumber || "New card"}</strong>
                                        <button type='button' className='icon-button' onClick={() => removeCard(index)} aria-label='Remove card'>
                                            <i className='fa-solid fa-xmark'></i>
                                        </button>
                                    </div>
                                    <div className='row'>
                                        <div className='col-md-6'>
                                            <div className='form-floating mb-3'>
                                                <input className='form-control' value={card.nickname || ""}
                                                    onChange={event => updateCard(index, "nickname", event.target.value)} />
                                                <label>Nickname</label>
                                            </div>
                                        </div>
                                        <div className='col-md-6'>
                                            <div className='form-floating mb-3'>
                                                <input className='form-control' value={card.cardHolderName || ""}
                                                    onChange={event => updateCard(index, "cardHolderName", event.target.value)} />
                                                <label>Card Holder Name</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-md-8'>
                                            <div className='form-floating mb-3'>
                                                <Cleave className='form-control' value={card.cardNumber || ""}
                                                    onChange={event => updateCard(index, "cardNumber", event.target.value)}
                                                    options={{ creditCard: true }} />
                                                <label>Card Number</label>
                                            </div>
                                        </div>
                                        <div className='col-md-4'>
                                            <div className='form-floating mb-3'>
                                                <Cleave className='form-control' value={card.cardExpiry || ""}
                                                    onChange={event => updateCard(index, "cardExpiry", event.target.value)}
                                                    options={{ date: true, datePattern: ['m', 'y'] }} />
                                                <label>Expiry</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className='profile-actions'>
                        <button type='submit' className='btn btn-dark' disabled={saving}>
                            {saving ? "Saving..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    )
}
