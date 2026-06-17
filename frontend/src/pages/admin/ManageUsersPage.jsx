import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { CityService } from '../../services/cityService';
import { UserService } from '../../services/userService';

const ROLE_OPTIONS = [
    { value: "CUSTOMER", label: "Customer" },
    { value: "THEATER_MANAGER", label: "Theatre Manager" },
    { value: "ADMIN", label: "Super Admin" }
]

const BLACKLIST_DURATIONS = [
    { value: "7_DAYS", label: "7 days" },
    { value: "1_MONTH", label: "1 month" },
    { value: "3_MONTHS", label: "3 months" },
    { value: "6_MONTHS", label: "6 months" },
    { value: "PERMANENT", label: "Permanent" }
]

export default function ManageUsersPage() {

    const userService = useMemo(() => new UserService(), []);
    const cityService = useMemo(() => new CityService(), []);
    const currentUser = useSelector(state => state.user.payload);
    const [users, setUsers] = useState([]);
    const [theaterOptions, setTheaterOptions] = useState([]);
    const [userDrafts, setUserDrafts] = useState({});
    const [historyUserEmail, setHistoryUserEmail] = useState("");
    const [searchText, setSearchText] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [initialFilter, setInitialFilter] = useState("ALL");

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();
        return users
            .filter(user => roleFilter === "ALL" || (user.role || "CUSTOMER") === roleFilter)
            .filter(user => {
                if (statusFilter === "ALL") {
                    return true;
                }
                if (statusFilter === "BLACKLISTED") {
                    return Boolean(user.blacklisted);
                }
                if (statusFilter === "PENDING_MANAGER") {
                    return user.theaterManagerRequestStatus === "PENDING";
                }
                if (statusFilter === "REJECTED_MANAGER") {
                    return user.theaterManagerRequestStatus === "REJECTED";
                }
                if (statusFilter === "VERIFIED") {
                    return Boolean(user.verified || user.emailVerified);
                }
                return !(user.verified || user.emailVerified);
            })
            .filter(user => {
                if (initialFilter === "ALL") {
                    return true;
                }
                return (user.fullName || user.email || "").trim().slice(0, 1).toUpperCase() === initialFilter;
            })
            .filter(user => {
                if (!normalizedSearch) {
                    return true;
                }
                return [user.fullName, user.email, user.role, user.theaterManagerRequestStatus, ...(user.managedTheaterNames || [])]
                    .filter(Boolean)
                    .some(value => String(value).toLowerCase().includes(normalizedSearch));
            })
            .sort((first, second) => (first.fullName || first.email || "").localeCompare(second.fullName || second.email || ""));
    }, [users, searchText, roleFilter, statusFilter, initialFilter]);

    const availableInitials = useMemo(() => {
        return [...new Set(users.map(user => (user.fullName || user.email || "").trim().slice(0, 1).toUpperCase()).filter(Boolean))].sort();
    }, [users]);

    const loadUsers = useCallback(() => {
        userService.getAllUsers()
            .then(result => {
                const loadedUsers = result.data || [];
                setUsers(loadedUsers);
                setUserDrafts(currentDrafts => buildDrafts(loadedUsers, currentDrafts));
            })
            .catch(() => toast.error("Could not load users. Please sign in as admin.", {
                theme: "colored",
                position: "top-center"
            }));
    }, [userService])

    useEffect(() => {
        loadUsers();
    }, [loadUsers])

    useEffect(() => {
        cityService.getTheaterLibrary()
            .then(result => {
                const theaters = (result.data || []).flatMap(city => (
                    (city.theaters || city.saloon || []).map(theater => ({
                        cityName: city.cityName,
                        theaterName: theater.theaterName || theater.saloonName
                    }))
                )).filter(theater => theater.theaterName);
                setTheaterOptions(theaters);
            })
            .catch(() => setTheaterOptions([]));
    }, [cityService])

    function updateDraft(email, patch) {
        setUserDrafts(currentDrafts => ({
            ...currentDrafts,
            [email]: {
                ...currentDrafts[email],
                ...patch
            }
        }));
    }

    function toggleDraftTheater(email, theaterName) {
        setUserDrafts(currentDrafts => {
            const draft = currentDrafts[email] || defaultDraft();
            const selectedTheaters = draft.theaterNames || [];
            const exists = selectedTheaters.some(name => name.toLowerCase() === theaterName.toLowerCase());
            return {
                ...currentDrafts,
                [email]: {
                    ...draft,
                    theaterNames: exists
                        ? selectedTheaters.filter(name => name.toLowerCase() !== theaterName.toLowerCase())
                        : [...selectedTheaters, theaterName]
                }
            }
        });
    }

    function updateUserRole(user) {
        const draft = userDrafts[user.email] || defaultDraft(user);
        if (draft.role === "THEATER_MANAGER" && (!draft.theaterNames || draft.theaterNames.length === 0)) {
            toast.warning("Choose at least one theatre for this theatre manager.", {
                theme: "colored",
                position: "top-center"
            });
            return;
        }

        userService.updateUserRole(user.email, draft.role, (draft.theaterNames || []).join(", "))
            .then(result => {
                toast.success(`${result.data.fullName || result.data.email} is now ${formatRole(result.data.role)}.`, {
                    theme: "colored",
                    position: "top-center"
                });
                loadUsers();
            })
            .catch(e => {
                toast.error(getErrorMessage(e, "Could not update role."), {
                    theme: "colored",
                    position: "top-center"
                });
            });
    }

    function approveTheaterManager(user) {
        const draft = userDrafts[user.email] || defaultDraft(user);
        if (!draft.theaterNames || draft.theaterNames.length === 0) {
            toast.warning("Choose at least one theatre before approval.", {
                theme: "colored",
                position: "top-center"
            });
            return;
        }

        userService.approveTheaterManagerRequest(user.email, draft.theaterNames.join(", "))
            .then(result => {
                toast.success(`${result.data.fullName || result.data.email} is now a theatre manager.`, {
                    theme: "colored",
                    position: "top-center"
                });
                loadUsers();
            })
            .catch(e => {
                toast.error(getErrorMessage(e, "Could not approve theatre manager request."), {
                    theme: "colored",
                    position: "top-center"
                });
            });
    }

    function rejectTheaterManager(user) {
        const draft = userDrafts[user.email] || defaultDraft(user);
        const reason = draft.rejectionReason || "Request rejected by admin";
        if (!window.confirm(`Reject theatre manager request for ${user.email}? The account will be scheduled for deletion after 24 hours.`)) {
            return;
        }

        userService.rejectTheaterManagerRequest(user.email, reason)
            .then(result => {
                toast.success(`${result.data.email} was rejected and scheduled for deletion after 24 hours.`, {
                    theme: "colored",
                    position: "top-center"
                });
                loadUsers();
            })
            .catch(e => {
                toast.error(getErrorMessage(e, "Could not reject theatre manager request."), {
                    theme: "colored",
                    position: "top-center"
                });
            });
    }

    function blacklistUser(user) {
        if (isCurrentUser(user)) {
            toast.warning("You cannot blacklist your own admin account.", {
                theme: "colored",
                position: "top-center"
            });
            return;
        }

        const draft = userDrafts[user.email] || defaultDraft(user);
        userService.blacklistUser(user.email, draft.blacklistDuration, draft.blacklistReason)
            .then(result => {
                toast.success(`${result.data.email} was blacklisted. Notification email is being sent.`, {
                    theme: "colored",
                    position: "top-center"
                });
                loadUsers();
            })
            .catch(e => {
                toast.error(getErrorMessage(e, "Could not blacklist user."), {
                    theme: "colored",
                    position: "top-center"
                });
            });
    }

    function removeBlacklist(user) {
        userService.removeUserBlacklist(user.email)
            .then(result => {
                toast.success(`${result.data.email} can sign in again.`, {
                    theme: "colored",
                    position: "top-center"
                });
                loadUsers();
            })
            .catch(e => {
                toast.error(getErrorMessage(e, "Could not remove blacklist."), {
                    theme: "colored",
                    position: "top-center"
                });
            });
    }

    const deleteUser = (user) => {
        if (isCurrentUser(user)) {
            toast.warning("Use Profile to delete your own account with OTP confirmation.", {
                theme: "colored",
                position: "top-center"
            });
            return;
        }

        if (!window.confirm(`Delete ${user.email}? Admin deletion removes the account and related ticket records.`)) {
            return;
        }

        userService.deleteUser(user.email)
            .then(() => {
                toast.success(`${user.email} was deleted by admin with related records.`, {
                    theme: "colored",
                    position: "top-center"
                });
                setHistoryUserEmail(currentEmail => currentEmail === user.email ? "" : currentEmail);
                loadUsers();
            })
            .catch(e => {
                toast.error(getErrorMessage(e, "Could not delete user."), {
                    theme: "colored",
                    position: "top-center"
                });
            });
    }

    function toggleHistory(user) {
        setHistoryUserEmail(currentEmail => currentEmail === user.email ? "" : user.email);
    }

    function isCurrentUser(user) {
        return currentUser?.email && user.email?.toLowerCase() === currentUser.email.toLowerCase();
    }

    function countFavorites(user) {
        return (user.favoriteMovies?.length || 0) + (user.favoriteTheaters?.length || 0);
    }

    return (
        <div className="admin-page admin-users-page container-fluid py-5 mt-5 text-start">
            <div className="admin-users-shell">
                <div className="admin-users-header">
                    <div>
                        <p className='booking-kicker'>Super Admin</p>
                        <h2>Manage Users</h2>
                        <p className="text-muted">Update roles directly from user rows, review history, blacklist temporarily, or delete an account by admin action.</p>
                    </div>
                    <div className='admin-users-stats'>
                        <span><strong>{users.length}</strong> users</span>
                        <span><strong>{users.filter(user => user.role === "ADMIN").length}</strong> super admins</span>
                        <span><strong>{users.filter(user => user.role === "THEATER_MANAGER").length}</strong> theater managers</span>
                        <span><strong>{users.filter(user => user.theaterManagerRequestStatus === "PENDING").length}</strong> pending requests</span>
                    </div>
                </div>

                <section className='admin-user-filter-bar'>
                    <div className='admin-search-field'>
                        <i className='fa-solid fa-magnifying-glass'></i>
                        <input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder='Search by name, email, role, or theatre' />
                    </div>
                    <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}>
                        <option value="ALL">All roles</option>
                        {ROLE_OPTIONS.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                    <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                        <option value="ALL">All status</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="UNVERIFIED">Unverified</option>
                        <option value="BLACKLISTED">Blacklisted</option>
                        <option value="PENDING_MANAGER">Pending manager</option>
                        <option value="REJECTED_MANAGER">Rejected manager</option>
                    </select>
                    <select value={initialFilter} onChange={event => setInitialFilter(event.target.value)}>
                        <option value="ALL">All letters</option>
                        {availableInitials.map(initial => (
                            <option key={initial} value={initial}>{initial}</option>
                        ))}
                    </select>
                    <button type='button' className='btn btn-outline-dark' onClick={() => {
                        setSearchText("");
                        setRoleFilter("ALL");
                        setStatusFilter("ALL");
                        setInitialFilter("ALL");
                    }}>
                        Reset
                    </button>
                </section>

                <div className="admin-user-list">
                    {filteredUsers.map(user => {
                        const historyOpen = historyUserEmail === user.email;
                        const bookings = user.bookedMovies || [];
                        const draft = userDrafts[user.email] || defaultDraft(user);
                        const isBlacklisted = Boolean(user.blacklisted);
                        return (
                            <article className={`admin-user-card ${isBlacklisted ? "blacklisted" : ""}`} key={user.userId || user.email}>
                                <div className='admin-user-row'>
                                    <div className='admin-user-identity'>
                                        <div className='admin-user-avatar'>{(user.fullName || user.email || "?").slice(0, 1).toUpperCase()}</div>
                                        <div>
                                            <h3>{user.fullName || "Unnamed User"}</h3>
                                            <p>{user.email}</p>
                                            {isBlacklisted ? (
                                                <small className='admin-blacklist-note'>{formatBlacklistStatus(user)}</small>
                                            ) : null}
                                            {user.theaterManagerRequestStatus && user.theaterManagerRequestStatus !== "NONE" ? (
                                                <small className='admin-blacklist-note'>{formatTheaterManagerRequest(user)}</small>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className='admin-user-role-editor'>
                                        <label>
                                            <span>Role</span>
                                            <select value={draft.role} onChange={event => updateDraft(user.email, {
                                                role: event.target.value,
                                                theaterNames: event.target.value === "THEATER_MANAGER" ? draft.theaterNames : []
                                            })}>
                                                {ROLE_OPTIONS.map(role => (
                                                    <option key={role.value} value={role.value}>{role.label}</option>
                                                ))}
                                            </select>
                                        </label>
                                        {draft.role === "THEATER_MANAGER" ? (
                                            <div className='admin-theater-chip-list'>
                                                {theaterOptions.length === 0 ? (
                                                    <small>No theatres found.</small>
                                                ) : theaterOptions.map(theater => (
                                                    <button type='button'
                                                        key={`${user.email}-${theater.cityName}-${theater.theaterName}`}
                                                        className={`admin-theater-chip ${draft.theaterNames?.some(name => name.toLowerCase() === theater.theaterName.toLowerCase()) ? "active" : ""}`}
                                                        onClick={() => toggleDraftTheater(user.email, theater.theaterName)}>
                                                        {theater.theaterName}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                        <button type='button' className='btn btn-primary admin-row-primary' onClick={() => updateUserRole(user)}>
                                            Update Role
                                        </button>
                                        {user.theaterManagerRequestStatus === "PENDING" ? (
                                            <div className='admin-blacklist-controls'>
                                                <button type='button' className='btn btn-outline-dark' onClick={() => approveTheaterManager(user)}>
                                                    Approve
                                                </button>
                                                <input value={draft.rejectionReason || ""} onChange={event => updateDraft(user.email, { rejectionReason: event.target.value })} placeholder='Reject reason' />
                                                <button type='button' className='btn btn-outline-danger' onClick={() => rejectTheaterManager(user)}>
                                                    Reject
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className='admin-user-metrics'>
                                        <span><strong>{formatRole(user.role)}</strong> Current Role</span>
                                        <span><strong>{user.verified || user.emailVerified ? "Yes" : "No"}</strong> Verified</span>
                                        {user.role === "THEATER_MANAGER" ? (
                                            <span><strong>{(user.managedTheaterNames || []).join(", ") || "Pending"}</strong> Assigned</span>
                                        ) : null}
                                        {user.theaterManagerRequestStatus && user.theaterManagerRequestStatus !== "NONE" ? (
                                            <span><strong>{formatRequestStatus(user.theaterManagerRequestStatus)}</strong> Manager Request</span>
                                        ) : null}
                                        <span><strong>{bookings.length}</strong> Bookings</span>
                                        <span><strong>{user.savedPaymentCards?.length || 0}</strong> Cards</span>
                                        <span><strong>{countFavorites(user)}</strong> Favorites</span>
                                    </div>

                                    <div className='admin-user-actions'>
                                        <button type='button' className='btn btn-outline-dark' onClick={() => toggleHistory(user)}>
                                            {historyOpen ? "Hide History" : "History"}
                                        </button>
                                        <div className='admin-blacklist-controls'>
                                            <select value={draft.blacklistDuration} onChange={event => updateDraft(user.email, { blacklistDuration: event.target.value })}>
                                                {BLACKLIST_DURATIONS.map(duration => (
                                                    <option key={duration.value} value={duration.value}>{duration.label}</option>
                                                ))}
                                            </select>
                                            <input value={draft.blacklistReason || ""} onChange={event => updateDraft(user.email, { blacklistReason: event.target.value })} placeholder='Reason' />
                                            {isBlacklisted ? (
                                                <button type='button' className='btn btn-outline-dark' onClick={() => removeBlacklist(user)}>Unblacklist</button>
                                            ) : (
                                                <button type='button' className='btn btn-outline-warning' disabled={isCurrentUser(user)} onClick={() => blacklistUser(user)}>Blacklist</button>
                                            )}
                                        </div>
                                        <button type='button' className='btn btn-outline-danger' disabled={isCurrentUser(user)} onClick={() => deleteUser(user)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {historyOpen ? (
                                    <section className='admin-history-panel'>
                                        <div className='admin-history-header'>
                                            <div>
                                                <p className='booking-kicker'>Booking History</p>
                                                <h3>{user.fullName || user.email}</h3>
                                            </div>
                                            <button type='button' className='btn btn-outline-dark btn-sm' onClick={() => setHistoryUserEmail("")}>Close</button>
                                        </div>
                                        <div className='admin-history-list'>
                                            {bookings.length === 0 ? (
                                                <p className='text-muted mb-0'>No booking history for this user.</p>
                                            ) : bookings.map(ticket => (
                                                <div className='admin-history-card' key={ticket.bookingCode}>
                                                    <div>
                                                        <strong>{ticket.movie?.movieName || "Movie Ticket"}</strong>
                                                        <span>{ticket.bookingCode}</span>
                                                    </div>
                                                    <div>
                                                        <span>{ticket.theatreName || ticket.saloonName || "-"}</span>
                                                        <span>{ticket.movieDay || "-"} at {ticket.showtimeStartTime || ticket.movieStartTime || "-"}</span>
                                                    </div>
                                                    <div>
                                                        <span>Seats: {Array.isArray(ticket.seats) ? ticket.seats.join(", ") : "-"}</span>
                                                        <span>Total: {formatCurrency(ticket.totalAmount)}</span>
                                                    </div>
                                                    <span className='ticket-status-pill'>{ticket.status || "CONFIRMED"}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className='admin-favorites-panel'>
                                            <div className='admin-history-header'>
                                                <div>
                                                    <p className='booking-kicker'>Favorites</p>
                                                    <h3>Favorite Movies</h3>
                                                </div>
                                            </div>
                                            <div className='admin-favorite-list'>
                                                {(user.favoriteMovies || []).length === 0 ? (
                                                    <p className='text-muted mb-0'>No favorite movies for this user.</p>
                                                ) : (user.favoriteMovies || []).map(movie => (
                                                    <div className='admin-favorite-card' key={movie.movieId}>
                                                        <div className='profile-favorite-poster'>
                                                            {movie.movieImageUrl ? <img src={movie.movieImageUrl} alt={movie.movieName} /> : <i className='fa-solid fa-film'></i>}
                                                        </div>
                                                        <div>
                                                            <strong>{movie.movieName}</strong>
                                                            <span>{movie.addedAt ? `Added ${new Date(movie.addedAt).toLocaleDateString()}` : "Favorite movie"}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                ) : null}
                            </article>
                        )
                    })}

                    {users.length === 0 ? (
                        <div className='admin-empty-users'>No users found.</div>
                    ) : null}
                    {users.length > 0 && filteredUsers.length === 0 ? (
                        <div className='admin-empty-users'>No users match these filters.</div>
                    ) : null}
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}

function buildDrafts(users, currentDrafts) {
    return users.reduce((drafts, user) => ({
        ...drafts,
        [user.email]: {
            ...defaultDraft(user),
            ...(currentDrafts[user.email] || {})
        }
    }), {})
}

function defaultDraft(user = {}) {
    return {
        role: user.theaterManagerRequestStatus === "PENDING" ? "THEATER_MANAGER" : (user.role || "CUSTOMER"),
        theaterNames: user.managedTheaterNames || [],
        blacklistDuration: "7_DAYS",
        blacklistReason: "",
        rejectionReason: user.theaterManagerRejectionReason || ""
    }
}

function formatRequestStatus(status) {
    if (status === "PENDING") {
        return "Pending Approval";
    }
    if (status === "APPROVED") {
        return "Approved";
    }
    if (status === "REJECTED") {
        return "Rejected";
    }
    return "None";
}

function formatTheaterManagerRequest(user) {
    if (user.theaterManagerRequestStatus === "PENDING") {
        return "Theatre manager request pending admin approval";
    }
    if (user.theaterManagerRequestStatus === "REJECTED") {
        const deletionText = user.theaterManagerDeleteAfter
            ? ` Deletion after ${new Date(user.theaterManagerDeleteAfter).toLocaleString()}.`
            : "";
        return `Theatre manager request rejected.${deletionText}`;
    }
    if (user.theaterManagerRequestStatus === "APPROVED") {
        return "Theatre manager request approved";
    }
    return "";
}

function formatRole(role) {
    if (role === "ADMIN") {
        return "Super Admin";
    }
    if (role === "THEATER_MANAGER") {
        return "Theatre Manager";
    }
    return "Customer";
}

function formatCurrency(value) {
    return `INR ${Number(value || 0).toFixed(2)}`;
}

function formatBlacklistStatus(user) {
    if (!user.blacklisted) {
        return "";
    }
    if (!user.blacklistedUntil) {
        return "Blacklisted permanently";
    }
    return `Blacklisted until ${new Date(user.blacklistedUntil).toLocaleDateString()}`;
}

function getErrorMessage(error, fallback) {
    const data = error.response?.data;
    if (!data) {
        return fallback;
    }
    if (typeof data === "string") {
        return data;
    }
    if (data.message) {
        return data.message;
    }
    const ignoredKeys = ["timestamp", "status", "error", "path", "trace", "requestId"];
    const fieldMessage = Object.entries(data).find(([key, value]) =>
        !ignoredKeys.includes(key) && typeof value === "string" && value.trim()
    );
    return fieldMessage ? fieldMessage[1] : fallback;
}
