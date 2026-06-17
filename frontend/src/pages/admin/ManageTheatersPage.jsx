import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import { useSelector } from 'react-redux'
import { CityService } from '../../services/cityService'
import { MovieService } from '../../services/movieService'

const defaultShowtimes = "10:30, 13:45, 17:00, 20:15"
const OTHER_VALUE = "__other__"
const POPULAR_INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
    "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
    "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
    "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
    "Amritsar", "Navi Mumbai", "Prayagraj", "Ranchi", "Howrah", "Coimbatore", "Jabalpur",
    "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati",
    "Chandigarh", "Solapur", "Hubballi", "Mysuru", "Tiruchirappalli", "Bareilly",
    "Aligarh", "Tiruppur", "Moradabad", "Jalandhar", "Bhubaneswar", "Salem", "Warangal",
    "Guntur", "Noida", "Gurugram", "Dehradun", "Kochi", "Goa", "Mangalore", "Udaipur"
]

const POPULAR_THEATERS_BY_CITY = {
    Mumbai: ["CineSaga Bandra Luxe", "CineSaga Lower Parel", "CineSaga Juhu Prime", "CineSaga Andheri IMAX"],
    Delhi: ["CineSaga Connaught Place", "CineSaga Saket Select", "CineSaga Dwarka Grand", "CineSaga Rohini"],
    Bengaluru: ["CineSaga Orion Mall", "CineSaga Indiranagar", "CineSaga Whitefield", "CineSaga Koramangala"],
    Hyderabad: ["CineSaga Atrium", "CineSaga Banjara Hills", "CineSaga Hitech City", "CineSaga Kukatpally"],
    Chennai: ["CineSaga Marina Luxe", "CineSaga T Nagar", "CineSaga Velachery", "CineSaga Anna Nagar"],
    Kolkata: ["CineSaga Park Street", "CineSaga Salt Lake", "CineSaga Howrah", "CineSaga New Town"],
    Pune: ["CineSaga Pavilion", "CineSaga Kalyani Nagar", "CineSaga Hinjewadi", "CineSaga Wakad"],
    Ahmedabad: ["CineSaga SG Highway", "CineSaga AlphaOne", "CineSaga Maninagar", "CineSaga Science City"],
    Jaipur: ["CineSaga MI Road", "CineSaga Vaishali", "CineSaga Malviya Nagar", "CineSaga Mansarovar"]
}

export default function ManageTheatersPage() {
    const userFromRedux = useSelector(state => state.user.payload)
    const isAdmin = hasRole(userFromRedux, "ADMIN")
    const movieService = useMemo(() => new MovieService(), [])
    const cityService = useMemo(() => new CityService(), [])

    const [movies, setMovies] = useState([])
    const [theaterLibrary, setTheaterLibrary] = useState([])
    const [movieCities, setMovieCities] = useState([])
    const [selectedMovieId, setSelectedMovieId] = useState("")
    const [selectedTheaterId, setSelectedTheaterId] = useState("")
    const [cityChoice, setCityChoice] = useState("")
    const [newCityName, setNewCityName] = useState("")
    const [theaterChoice, setTheaterChoice] = useState("")
    const [theaterName, setTheaterName] = useState("")
    const [showtimes, setShowtimes] = useState(defaultShowtimes)
    const [loading, setLoading] = useState(false)

    const selectedMovie = movies.find(movie => String(movie.movieId) === String(selectedMovieId))
    const allTheaters = useMemo(() => flattenTheaters(theaterLibrary), [theaterLibrary])
    const selectedTheater = allTheaters.find(item => String(item.theaterId) === String(selectedTheaterId)) || allTheaters[0]
    const cityOptions = useMemo(() => uniqueNames([...theaterLibrary.map(city => city.cityName), ...POPULAR_INDIAN_CITIES]), [theaterLibrary])
    const effectiveCityName = cityChoice === OTHER_VALUE ? newCityName.trim() : cityChoice
    const theaterOptions = useMemo(() => {
        const existing = getTheaters(theaterLibrary.find(city => city.cityName === effectiveCityName)).map(getTheaterName)
        return uniqueNames([...existing, ...getPopularTheaters(effectiveCityName)])
    }, [theaterLibrary, effectiveCityName])
    const totalLibraryTheaters = allTheaters.length
    const assignedTheaters = movieCities.reduce((count, city) => count + getTheaters(city).length, 0)
    const assignedShowtimes = movieCities.reduce((count, city) => (
        count + getTheaters(city).reduce((theaterCount, theater) => theaterCount + getShowtimes(theater).length, 0)
    ), 0)

    useEffect(() => {
        movieService.getAllMovies()
            .then(result => {
                const loadedMovies = result.data || []
                setMovies(loadedMovies)
                setSelectedMovieId(loadedMovies[0]?.movieId ? String(loadedMovies[0].movieId) : "")
            })
            .catch(() => {
                setMovies([])
                toast.error("Could not load movies.", { theme: "colored", position: "top-center" })
            })
    }, [movieService])

    const loadTheaterLibrary = useCallback(() => {
        setLoading(true)
        cityService.getTheaterLibrary()
            .then(result => {
                const loadedCities = result.data || []
                setTheaterLibrary(loadedCities)
                setSelectedTheaterId(currentId => currentId || String(getTheaterId(getTheaters(loadedCities[0])?.[0]) || ""))
                setCityChoice(currentCity => currentCity || loadedCities[0]?.cityName || "Mumbai")
            })
            .catch(() => {
                setTheaterLibrary([])
                toast.error("Could not load theatre library.", { theme: "colored", position: "top-center" })
            })
            .finally(() => setLoading(false))
    }, [cityService])

    const loadMovieCities = useCallback((movieId = selectedMovieId) => {
        if (!movieId) {
            setMovieCities([])
            return
        }
        setLoading(true)
        cityService.getCitiesByMovieId(movieId)
            .then(result => {
                const loadedCities = result.data || []
                setMovieCities(loadedCities)
            })
            .catch(() => {
                setMovieCities([])
                toast.error("Could not load movie showtimes.", { theme: "colored", position: "top-center" })
            })
            .finally(() => setLoading(false))
    }, [cityService, selectedMovieId])

    useEffect(() => {
        loadTheaterLibrary()
    }, [loadTheaterLibrary])

    useEffect(() => {
        loadMovieCities(selectedMovieId)
    }, [selectedMovieId, loadMovieCities])

    function addTheater(event) {
        event.preventDefault()
        const cityName = cityChoice === OTHER_VALUE ? newCityName.trim() : cityChoice.trim()
        const cleanTheaterName = theaterChoice === OTHER_VALUE ? theaterName.trim() : theaterChoice.trim()

        if (!cityName || !cleanTheaterName) {
            toast.warning("Choose a city and theatre name.", { theme: "colored", position: "top-center" })
            return
        }

        cityService.addTheaterToLibrary({
            cityName,
            theaterName: cleanTheaterName,
            token: userFromRedux?.token
        }).then(result => {
            toast.success("Theatre added to the library.", { theme: "colored", position: "top-center" })
            setTheaterChoice("")
            setTheaterName("")
            setNewCityName("")
            loadTheaterLibrary()
            const addedTheater = getTheaters(result.data).find(theater => getTheaterName(theater).toLowerCase() === cleanTheaterName.toLowerCase())
            if (addedTheater) {
                setSelectedTheaterId(String(getTheaterId(addedTheater)))
            }
        }).catch(error => toast.error(getErrorMessage(error, "Could not add theatre."), {
            theme: "colored",
            position: "top-center"
        }))
    }

    function assignMovie(event) {
        event.preventDefault()
        const parsedShowtimes = showtimes.split(",").map(time => time.trim()).filter(Boolean)

        if (!selectedMovieId || !selectedTheater || parsedShowtimes.length === 0) {
            toast.warning("Choose a movie, theatre, and at least one showtime.", { theme: "colored", position: "top-center" })
            return
        }

        cityService.addTheater({
            movieId: Number(selectedMovieId),
            cityName: selectedTheater.cityName,
            theaterName: selectedTheater.theaterName,
            showtimes: parsedShowtimes,
            token: userFromRedux?.token
        }).then(() => {
            toast.success("Movie showtimes added to this theatre.", { theme: "colored", position: "top-center" })
            setShowtimes(defaultShowtimes)
            loadMovieCities()
        }).catch(error => toast.error(getErrorMessage(error, "Could not assign movie to theatre."), {
            theme: "colored",
            position: "top-center"
        }))
    }

    function removeMovieFromTheater(city, theater) {
        if (!window.confirm(`Remove ${selectedMovie?.movieName || "this movie"} from ${getTheaterName(theater)}?`)) {
            return
        }

        cityService.deleteTheater(selectedMovieId, city.cityId, getTheaterId(theater))
            .then(() => {
                toast.success("Movie removed from theatre.", { theme: "colored", position: "top-center" })
                loadMovieCities()
            })
            .catch(error => toast.error(getErrorMessage(error, "Could not remove movie from theatre."), {
                theme: "colored",
                position: "top-center"
            }))
    }

    function removeCityFromMovie(city) {
        if (!window.confirm(`Remove ${selectedMovie?.movieName || "this movie"} from every theatre in ${city.cityName}?`)) {
            return
        }

        cityService.deleteCity(selectedMovieId, city.cityId)
            .then(() => {
                toast.success("City removed from this movie.", { theme: "colored", position: "top-center" })
                loadMovieCities()
            })
            .catch(error => toast.error(getErrorMessage(error, "Could not remove city from movie."), {
                theme: "colored",
                position: "top-center"
            }))
    }

    return (
        <div className='admin-page manage-theaters-page container-fluid py-5 mt-5'>
            <div className='admin-users-shell'>
                <div className='admin-users-header'>
                    <div>
                        <p className='booking-kicker'>{isAdmin ? "Super Admin" : "Theatre Manager"}</p>
                        <h2>Manage Theatres</h2>
                        <p className='text-muted'>Create theatre locations first, then assign movies and showtimes separately.</p>
                    </div>
                    <div className='admin-users-stats'>
                        <span><strong>{theaterLibrary.length}</strong> cities</span>
                        <span><strong>{totalLibraryTheaters}</strong> theatres</span>
                        <span><strong>{assignedShowtimes}</strong> movie showtimes</span>
                    </div>
                </div>

                <section className='manage-theater-layout'>
                    <div className='manage-theater-forms'>
                        <div className='manage-movie-form-panel'>
                            <div className='profile-panel-header'>
                                <div>
                                    <p className='booking-kicker'>Create</p>
                                    <h3>Add Theatre</h3>
                                </div>
                            </div>

                            <form className='manage-movie-form' onSubmit={addTheater}>
                                <div className='form-floating'>
                                    <select className='form-select form-select-lg' id='theaterCity' value={cityChoice}
                                        onChange={event => {
                                            setCityChoice(event.target.value)
                                            setTheaterChoice("")
                                        }}>
                                        <option value='' disabled>Choose city</option>
                                        {cityOptions.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                        <option value={OTHER_VALUE}>Other City</option>
                                    </select>
                                    <label htmlFor='theaterCity'>City</label>
                                </div>

                                {cityChoice === OTHER_VALUE ? (
                                    <div className='form-floating'>
                                        <input className='form-control' id='newCityName' value={newCityName}
                                            onChange={event => {
                                                setNewCityName(event.target.value)
                                                setTheaterChoice("")
                                            }}
                                            placeholder='City Name' />
                                        <label htmlFor='newCityName'>Other City Name</label>
                                    </div>
                                ) : null}

                                <div className='form-floating'>
                                    <select className='form-select form-select-lg' id='theaterChoice' value={theaterChoice}
                                        onChange={event => setTheaterChoice(event.target.value)}>
                                        <option value='' disabled>Choose popular theatre</option>
                                        {theaterOptions.map(theater => (
                                            <option key={theater} value={theater}>{theater}</option>
                                        ))}
                                        <option value={OTHER_VALUE}>Other Theatre</option>
                                    </select>
                                    <label htmlFor='theaterChoice'>Theatre</label>
                                </div>

                                {theaterChoice === OTHER_VALUE ? (
                                    <div className='form-floating'>
                                        <input className='form-control' id='theaterName' value={theaterName}
                                            onChange={event => setTheaterName(event.target.value)}
                                            placeholder='Theatre Name' />
                                        <label htmlFor='theaterName'>Other Theatre Name</label>
                                    </div>
                                ) : null}

                                <button type='submit' className='btn btn-primary'>Add Theatre</button>
                            </form>
                        </div>

                        <div className='manage-movie-form-panel'>
                            <div className='profile-panel-header'>
                                <div>
                                    <p className='booking-kicker'>Schedule</p>
                                    <h3>Add Movie To Theatre</h3>
                                </div>
                            </div>

                            <form className='manage-movie-form' onSubmit={assignMovie}>
                                <div className='form-floating'>
                                    <select className='form-select form-select-lg' id='theaterMovie' value={selectedMovieId}
                                        onChange={event => setSelectedMovieId(event.target.value)}>
                                        <option value='' disabled>{movies.length ? "Choose movie" : "No movies loaded"}</option>
                                        {movies.map(movie => (
                                            <option key={movie.movieId} value={movie.movieId}>{movie.movieName}</option>
                                        ))}
                                    </select>
                                    <label htmlFor='theaterMovie'>Movie</label>
                                </div>

                                <div className='form-floating'>
                                    <select className='form-select form-select-lg' id='libraryTheater' value={selectedTheaterId}
                                        onChange={event => setSelectedTheaterId(event.target.value)}>
                                        <option value='' disabled>{allTheaters.length ? "Choose theatre" : "Add a theatre first"}</option>
                                        {allTheaters.map(theater => (
                                            <option key={theater.theaterId} value={theater.theaterId}>{theater.theaterName} - {theater.cityName}</option>
                                        ))}
                                    </select>
                                    <label htmlFor='libraryTheater'>Theatre</label>
                                </div>

                                <div className='form-floating'>
                                    <input className='form-control' id='showtimes' value={showtimes}
                                        onChange={event => setShowtimes(event.target.value)}
                                        placeholder='Showtimes' />
                                    <label htmlFor='showtimes'>Showtimes</label>
                                </div>

                                <button type='submit' className='btn btn-primary'>Add Movie Showtimes</button>
                            </form>
                        </div>
                    </div>

                    <div className='manage-movie-list-panel'>
                        <div className='profile-panel-header'>
                            <div>
                                <p className='booking-kicker'>Library</p>
                                <h3>City & Theatre Library</h3>
                            </div>
                            <button type='button' className='btn btn-outline-dark' onClick={() => {
                                loadTheaterLibrary()
                                loadMovieCities()
                            }} disabled={loading}>
                                {loading ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>

                        {theaterLibrary.length === 0 ? (
                            <p className='profile-muted text-start'>No theatres are in the library yet.</p>
                        ) : (
                            <div className='manage-theater-browser'>
                                <div className='manage-city-list'>
                                    {theaterLibrary.map(city => (
                                        <button type='button' key={city.cityId}
                                            className={`manage-city-card ${String(selectedTheater?.cityId) === String(city.cityId) ? "active" : ""}`}
                                            onClick={() => {
                                                const firstTheater = getTheaters(city)[0]
                                                setSelectedTheaterId(firstTheater ? String(getTheaterId(firstTheater)) : "")
                                            }}>
                                            <span><i className='fa-solid fa-location-dot'></i></span>
                                            <strong>{city.cityName}</strong>
                                            <small>{getTheaters(city).length} theatres</small>
                                        </button>
                                    ))}
                                </div>

                                <div className='manage-theater-list'>
                                    <div className='manage-theater-list-header'>
                                        <div>
                                            <p className='booking-kicker'>Selected Movie</p>
                                            <h4>{selectedMovie?.movieName || "Choose a movie"}</h4>
                                        </div>
                                        <span className='ticket-status-pill muted'>{assignedTheaters} assigned theatres</span>
                                    </div>

                                    {selectedTheater ? (
                                        <article className='manage-theater-card active-library-theater'>
                                            <div>
                                                <h5>{selectedTheater.theaterName}</h5>
                                                <p>{selectedTheater.cityName}</p>
                                            </div>
                                            <button type='button' className='btn btn-outline-dark' onClick={() => setSelectedTheaterId(String(selectedTheater.theaterId))}>Selected</button>
                                        </article>
                                    ) : null}

                                    {movieCities.length === 0 ? (
                                        <p className='profile-muted text-start'>No theatres are showing this movie yet.</p>
                                    ) : movieCities.map(city => (
                                        <section className='assigned-city-section' key={city.cityId}>
                                            <div className='manage-theater-list-header'>
                                                <div>
                                                    <p className='booking-kicker'>Movie City</p>
                                                    <h4>{city.cityName}</h4>
                                                </div>
                                                {isAdmin ? (
                                                    <button type='button' className='btn btn-outline-danger' onClick={() => removeCityFromMovie(city)}>Remove City</button>
                                                ) : null}
                                            </div>
                                            {getTheaters(city).map(theater => (
                                                <article className='manage-theater-card' key={getTheaterId(theater)}>
                                                    <div>
                                                        <h5>{getTheaterName(theater)}</h5>
                                                        <p>{getShowtimes(theater).length > 0 ? getShowtimes(theater).join(", ") : "Showtimes available after refresh"}</p>
                                                    </div>
                                                    <button type='button' className='btn btn-outline-danger'
                                                        onClick={() => removeMovieFromTheater(city, theater)}>Remove Movie</button>
                                                </article>
                                            ))}
                                        </section>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
            <ToastContainer />
        </div>
    )
}

function flattenTheaters(cities) {
    return (cities || []).flatMap(city => getTheaters(city).map(theater => ({
        cityId: city.cityId,
        cityName: city.cityName,
        theaterId: getTheaterId(theater),
        theaterName: getTheaterName(theater)
    }))).filter(theater => theater.theaterId)
}

function getTheaters(city) {
    return city?.theaters || city?.saloon || []
}

function getTheaterId(theater) {
    return theater?.theaterId ?? theater?.saloonId
}

function getTheaterName(theater) {
    return theater?.theaterName || theater?.saloonName || "Unnamed theatre"
}

function getShowtimes(theater) {
    return theater?.showtimes || theater?.movieBeginTimes || []
}

function getPopularTheaters(cityName) {
    if (!cityName) {
        return ["CineSaga Central", "CineSaga Grand", "CineSaga Luxe", "CineSaga Screen 1"]
    }
    return POPULAR_THEATERS_BY_CITY[cityName] || [
        `CineSaga ${cityName} Central`,
        `CineSaga ${cityName} Grand`,
        `CineSaga ${cityName} Luxe`,
        `CineSaga ${cityName} Screen 1`
    ]
}

function uniqueNames(values) {
    return [...new Set(values.filter(Boolean).map(value => value.trim()).filter(Boolean))]
}

function hasRole(user, roleName) {
    return user?.roles?.some(role => role === roleName || role === "ROLE_" + roleName)
}

function getErrorMessage(error, fallback) {
    const data = error.response?.data
    if (!data) {
        return fallback
    }
    if (typeof data === "string") {
        return data
    }
    if (data.message || data.error) {
        return data.message || data.error
    }
    const firstTextValue = Object.values(data).find(value => typeof value === "string" && value.trim())
    return firstTextValue || fallback
}
