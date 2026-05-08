import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/pagination"
import { Pagination } from "swiper"
import { MovieService } from '../services/movieService'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { demoMovies } from '../data/demoMovies'

export default function MainPage() {

    const movieService = useMemo(() => new MovieService(), [])
    const navigate = useNavigate()
    const userFromRedux = useSelector(state => state.user.payload)
    const [movies, setMovies] = useState([])
    const [activeFilter, setActiveFilter] = useState("now")

    const getMovies = useCallback(async (filter = "now") => {
        setActiveFilter(filter)
        try {
            const result = filter === "soon"
                ? await movieService.getAllComingSoonMovies()
                : await movieService.getAllDisplayingMovies()
            const apiMovies = Array.isArray(result.data) ? result.data : []
            setMovies(apiMovies.length > 0 ? apiMovies : demoMovies[filter])
        } catch (error) {
            setMovies(demoMovies[filter])
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

    return (
        <main className='home-page'>
            <section className='home-hero'>
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
                        1200: { slidesPerView: 5 }
                    }}
                    pagination={{
                        clickable: true,
                    }}
                    modules={[Pagination]}
                    className="mySwiper movie-slider modern-movie-slider"
                >
                    {movies.map(movie => (
                        <SwiperSlide key={movie.movieId || movie.movieName}>
                            <article className='movie-card' onClick={() => navigate("/movie/" + movie.movieId)}>
                                <img src={movie.movieImageUrl || "/clapboard.png"} alt={movie.movieName} />
                                <div className='movie-card-overlay'>
                                    <h3>{movie.movieName}</h3>
                                    <button type='button' className='btn btn-light btn-sm' onClick={(event) => startBooking(event, movie.movieId)}>
                                        Book Tickets
                                    </button>
                                </div>
                            </article>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>
        </main>
    )
}
