import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { Navigation, Pagination } from "swiper"
import { CityService } from '../services/cityService'
import { MovieService } from '../services/movieService'
import { UserService } from '../services/userService'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { mergeWithDemoMovies } from '../data/demoMovies'
import { toast, ToastContainer } from 'react-toastify'

export default function MainPage() {

    const movieService = useMemo(() => new MovieService(), [])
    const cityService = useMemo(() => new CityService(), [])
    const userService = useMemo(() => new UserService(), [])
    const navigate = useNavigate()
    const userFromRedux = useSelector(state => state.user.payload)
    const [movies, setMovies] = useState([])
    const [cityOptions, setCityOptions] = useState([])
    const [selectedCity, setSelectedCity] = useState("")
    const [cityMovies, setCityMovies] = useState([])
    const [activeFilter, setActiveFilter] = useState("now")

    const getMovies = useCallback(async (filter = "now") => {
        setActiveFilter(filter)
        try {
            const result = filter === "soon"
                ? await movieService.getAllComingSoonMovies()
                : await movieService.getAllDisplayingMovies()
            const apiMovies = Array.isArray(result.data) ? result.data : []
            setMovies(mergeWithDemoMovies(apiMovies, filter, 10))
        } catch (error) {
            setMovies(mergeWithDemoMovies([], filter, 10))
        }
    }, [movieService])

    const getCityMovies = useCallback(async (cityName) => {
        if (!cityName) {
            setCityMovies([])
            return
        }
        try {
            const result = await movieService.getMoviesByCity(cityName)
            setCityMovies(Array.isArray(result.data) ? result.data : [])
        } catch {
            setCityMovies([])
        }
    }, [movieService])

    function showMovies(filter) {
        getMovies(filter)
        setTimeout(() => {
            document.getElementById("movies")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 50)
    }

    function openLoginModal() {
        document.querySelector('[data-bs-target="#loginModal"]')?.click()
    }

    function startBooking(event, movieId) {
        event.stopPropagation()
        if (!userFromRedux) {
            sessionStorage.setItem("cineSagaPendingPath", "/movie/" + movieId)
            openLoginModal()
            return
        }
        navigate("/movie/" + movieId)
    }

    function openMovie(event, movie) {
        if (movie?.isDisplay === false || activeFilter === "soon") {
            navigate("/movie/" + movie.movieId)
            return
        }
        startBooking(event, movie.movieId)
    }

    function addToWishlist(event, movie) {
        event.stopPropagation()
        if (!userFromRedux) {
            sessionStorage.setItem("cineSagaPendingPath", "/movie/" + movie.movieId)
            openLoginModal()
            return
        }

        userService.addFavoriteMovie({
            movieId: movie.movieId,
            movieName: movie.movieName,
            movieImageUrl: movie.movieImageUrl
        }).then(() => {
            toast.success("Added to wishlist.", {
                theme: "light",
                position: "top-center"
            })
        }).catch(error => {
            toast.error(error.response?.data?.message || "Could not update wishlist.", {
                theme: "light",
                position: "top-center"
            })
        })
    }

    useEffect(() => {
        const filterFromHash = () => {
            const filter = window.location.hash === "#coming-soon" ? "soon" : "now"
            getMovies(filter)
        }
        const filterFromFooter = (event) => {
            getMovies(event.detail?.filter || "now")
        }

        filterFromHash()
        window.addEventListener("hashchange", filterFromHash)
        window.addEventListener("cineSagaMovieFilter", filterFromFooter)

        return () => {
            window.removeEventListener("hashchange", filterFromHash)
            window.removeEventListener("cineSagaMovieFilter", filterFromFooter)
        }
    }, [getMovies])

    useEffect(() => {
        cityService.getall()
            .then(result => {
                const cities = uniqueCityNames(result.data || [])
                setCityOptions(cities)
                setSelectedCity(currentCity => currentCity || cities[0] || "")
            })
            .catch(() => {
                setCityOptions([])
                setSelectedCity("")
            })
    }, [cityService])

    useEffect(() => {
        getCityMovies(selectedCity)
    }, [getCityMovies, selectedCity])

    function renderMovieCard(movie, mode = activeFilter) {
        const comingSoon = movie?.isDisplay === false || mode === "soon"
        return (
            <article className='movie-card' onClick={(event) => comingSoon ? navigate("/movie/" + movie.movieId) : openMovie(event, movie)}>
                <img src={movie.movieImageUrl || "/clapboard.png"} alt={movie.movieName} />
                <div className='movie-card-overlay'>
                    <h3>{movie.movieName}</h3>
                    <div className='movie-card-actions'>
                        {comingSoon ? (
                            <button type='button' className='btn btn-light btn-sm' onClick={(event) => {
                                event.stopPropagation()
                                navigate("/movie/" + movie.movieId)
                            }}>
                                <i className='fa-solid fa-circle-info me-2'></i>View
                            </button>
                        ) : (
                            <button type='button' className='btn btn-light btn-sm' onClick={(event) => startBooking(event, movie.movieId)}>
                                <i className='fa-solid fa-ticket me-2'></i>Book
                            </button>
                        )}
                        <button type='button' className='btn btn-light btn-sm movie-wishlist-action' onClick={(event) => addToWishlist(event, movie)}>
                            <i className='fa-regular fa-heart me-2'></i>Wishlist
                        </button>
                    </div>
                </div>
            </article>
        )
    }

    return (
        <main className='home-page'>
            <section className='home-hero'>
                <div className='home-hero-illustration' aria-hidden='true'>
                    <div className='hero-cinema-screen'>
                        <div className='hero-marquee-lights'>
                            <span></span><span></span><span></span><span></span><span></span><span></span>
                        </div>
                        <div className='hero-screen-glow'></div>
                    </div>
                    <div className='hero-seat-row hero-seat-row-one'>
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                    <div className='hero-seat-row hero-seat-row-two'>
                        <span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>
                    <div className='hero-ticket-card hero-ticket-left'>
                        <strong>ADMIT</strong>
                        <span></span>
                        <small>F7</small>
                    </div>
                    <div className='hero-ticket-card hero-ticket-right'>
                        <strong>CINESAGA</strong>
                        <span></span>
                        <small>20:15</small>
                    </div>
                    <div className='hero-popcorn'>
                        <span></span><span></span><span></span>
                    </div>
                </div>
                <div className='home-hero-content container'>
                    <p className='booking-kicker'>CineSaga Cinemas</p>
                    <h1>CineSaga</h1>
                    <p className='home-hero-copy'>A clean, fast movie booking experience for showtimes, seats, payments, and tickets.</p>
                    <div className='home-hero-actions'>
                        <button type='button' className='btn btn-primary btn-lg' onClick={() => showMovies("now")}>Now Showing</button>
                        <button type='button' className='btn btn-outline-light btn-lg' onClick={() => showMovies("soon")}>Coming Soon</button>
                    </div>
                    <div className='home-hero-stats'>
                        <span><strong>{movies.length || 12}</strong> Movies</span>
                        <span><strong>6</strong> Cities</span>
                        <span><strong>Fast</strong> Checkout</span>
                    </div>
                </div>
            </section>

            <section id='movies' className='movie-showcase'>
                <div className='container'>
                    <div className='showcase-header'>
                        <div className='text-start'>
                            <p className='booking-kicker'>Explore</p>
                            <h2>{activeFilter === "soon" ? "Coming Soon" : "Now Showing"}</h2>
                        </div>
                        <div className='filter-pills' role='tablist' aria-label='Movie filters'>
                            <button type='button' className={activeFilter === "now" ? "active" : ""} onClick={() => getMovies("now")}>Now Showing</button>
                            <button type='button' className={activeFilter === "soon" ? "active" : ""} onClick={() => getMovies("soon")}>Coming Soon</button>
                        </div>
                    </div>
                </div>

                <Swiper
                    slidesPerView={1}
                    spaceBetween={18}
                    breakpoints={{
                        576: { slidesPerView: 2 },
                        768: { slidesPerView: 3 },
                        1200: { slidesPerView: 5 },
                        1440: { slidesPerView: 6 }
                    }}
                    pagination={{
                        clickable: true,
                    }}
                    navigation
                    modules={[Navigation, Pagination]}
                    className="mySwiper movie-slider modern-movie-slider"
                >
                    {movies.map(movie => (
                        <SwiperSlide key={movie.movieId || movie.movieName}>
                            {renderMovieCard(movie)}
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className='container city-movie-header'>
                    <div className='text-start'>
                        <p className='booking-kicker'>City Shows</p>
                        <h2>{selectedCity ? `Movies in ${selectedCity}` : "Movies by City"}</h2>
                    </div>
                    <label className='city-select-control'>
                        <select value={selectedCity} onChange={event => setSelectedCity(event.target.value)}>
                            {cityOptions.map(cityName => (
                                <option key={cityName} value={cityName}>{cityName}</option>
                            ))}
                        </select>
                        <i className='fa-solid fa-chevron-down'></i>
                    </label>
                </div>

                {cityMovies.length > 0 ? (
                    <Swiper
                        slidesPerView={1}
                        spaceBetween={18}
                        breakpoints={{
                            576: { slidesPerView: 2 },
                            768: { slidesPerView: 3 },
                            1200: { slidesPerView: 5 },
                            1440: { slidesPerView: 6 }
                        }}
                        pagination={{ clickable: true }}
                        navigation
                        modules={[Navigation, Pagination]}
                        className="mySwiper movie-slider modern-movie-slider city-movie-slider"
                    >
                        {cityMovies.map(movie => (
                            <SwiperSlide key={`city-${selectedCity}-${movie.movieId || movie.movieName}`}>
                                {renderMovieCard(movie, "now")}
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <div className='container city-movie-empty'>
                        <span>No movies are showing in {selectedCity || "this city"} yet.</span>
                    </div>
                )}
            </section>
            <ToastContainer />
        </main>
    )
}

function uniqueCityNames(cities) {
    return [...new Set((cities || [])
        .map(city => city?.cityName)
        .filter(Boolean)
        .map(cityName => cityName.trim())
        .filter(Boolean))]
        .sort((first, second) => first.localeCompare(second))
}
