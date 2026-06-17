import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from '../pages/LoginModal';
import RegisterModal from '../pages/RegisterModal';
import { MovieService } from '../services/movieService';
import LoggedOut from './LoggedOut';
import LoggedIn from './LoggedIn';
import { mergeWithDemoMovies } from '../data/demoMovies';

export default function Navbar() {

    const navigate = useNavigate()

    const movieService = useMemo(() => new MovieService(), []);

    const [moviesInVision, setMoviesInVision] = useState([])
    const [comingSoonMovies, setComingSoonMovies] = useState([])
    const [isNavbarHidden, setIsNavbarHidden] = useState(false)
    const [theme, setTheme] = useState(() => {
        if (typeof window === "undefined") {
            return "light"
        }
        return localStorage.getItem("cineSagaTheme") || "light"
    })

    const userFromRedux = useSelector(state => state.user.payload);
    const isAdmin = hasRole(userFromRedux, "ADMIN");
    const canManageTheaters = isAdmin || hasRole(userFromRedux, "THEATER_MANAGER");
    const canManageMovies = canManageTheaters;

    const featuredMovie = moviesInVision[0];

    const goToMovie = (movieId) => {
        if (movieId) {
            closeMovieDrawer()
            navigate("/movie/" + movieId);
        }
    }

    const openLoginModal = () => {
        closeMovieDrawer()
        setTimeout(() => {
            document.querySelector('[data-bs-target="#loginModal"]')?.click();
        }, 150);
    }

    const goToMovies = (filter) => {
        closeMovieDrawer()
        navigate(filter === "soon" ? "/#coming-soon" : "/#movies");
        window.dispatchEvent(new CustomEvent("cineSagaMovieFilter", { detail: { filter: filter === "soon" ? "soon" : "now" } }));
        setTimeout(() => {
            document.getElementById("movies")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
    }

    const startBooking = (movieId) => {
        closeMovieDrawer()
        if (!userFromRedux) {
            if (movieId) {
                sessionStorage.setItem("cineSagaPendingPath", "/movie/" + movieId);
            }
            openLoginModal();
            return;
        }
        goToMovie(movieId);
    }

    useEffect(() => {
        movieService.getAllDisplayingMovies()
            .then(result => {
                const movies = Array.isArray(result.data) ? result.data : [];
                setMoviesInVision(mergeWithDemoMovies(movies, "now", 10));
            })
            .catch(() => setMoviesInVision(mergeWithDemoMovies([], "now", 10)));
        movieService.getAllComingSoonMovies()
            .then(result => {
                const movies = Array.isArray(result.data) ? result.data : [];
                setComingSoonMovies(mergeWithDemoMovies(movies, "soon", 10));
            })
            .catch(() => setComingSoonMovies(mergeWithDemoMovies([], "soon", 10)));
    }, [movieService])

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollY;
            setIsNavbarHidden(scrollingDown && currentScrollY > 96);
            lastScrollY = currentScrollY;
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [])

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        localStorage.setItem("cineSagaTheme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(currentTheme => currentTheme === "dark" ? "light" : "dark")
    }

    const goToAndClose = (path) => {
        closeMovieDrawer()
        navigate(path)
    }
    

  return (
    <div>
        <nav className={`navbar navbar-expand-lg navbar-light navbar-custom fixed-top ${isNavbarHidden ? "navbar-hidden" : ""}`}>
            <div class="container px-5">
            <Link to={"/"} className="navbar-brand cine-brand" style={{textDecoration:"none"}}>
                <span className='cine-brand-mark' aria-hidden='true'>
                    <i className='fa-solid fa-ticket'></i>
                </span>
                <span>CineSaga</span>
            </Link> 
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
                <div class="collapse navbar-collapse" id="navbarResponsive">
                    <ul class="navbar-nav ms-auto align-items-center">
                        <li class="nav-item"><Link className="nav-link" to="/" onClick={closeMovieDrawer}>Home</Link></li>
                        <li class="nav-item"><button type='button' className="nav-link nav-action-button" onClick={() => goToMovies("now")}>Now Showing</button></li>
                        <li class="nav-item"><button type='button' className="nav-link nav-action-button" onClick={() => goToMovies("soon")}>Coming Soon</button></li>
                        {canManageTheaters ? 
                            <li className="nav-item dropdown admin-nav-menu">
                                <button className="nav-link nav-action-button dropdown-toggle" type="button" id="adminMenu" data-bs-toggle="dropdown" aria-expanded="false">
                                    Manage
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="adminMenu">
                                    {canManageMovies ? (
                                        <li><button className="dropdown-item" type="button" onClick={() => goToAndClose("/addMovie")}>Manage Movies</button></li>
                                    ) : null}
                                    <li><button className="dropdown-item" type="button" onClick={() => goToAndClose("/admin/theaters")}>Manage Theatres</button></li>
                                    <li><button className="dropdown-item" type="button" onClick={() => goToAndClose("/admin/bookings")}>Booked Tickets</button></li>
                                    {isAdmin ? (
                                        <li><button className="dropdown-item" type="button" onClick={() => goToAndClose("/admin/users")}>Manage Users</button></li>
                                    ) : null}
                                </ul>
                            </li>
                        : null}

                        <li class="nav-item"><button type='button' className="nav-link nav-action-button"
                        data-bs-toggle="offcanvas" data-bs-target="#offcanvasTop" aria-controls="offcanvasTop">
                            Movies</button></li>
                        { userFromRedux ? <LoggedIn /> : <LoggedOut /> }
                        <li className="nav-item theme-nav-item">
                            <button type='button' className='theme-toggle-btn' onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                                <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
                                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        {/* Login Modal */}
        <LoginModal />
        <RegisterModal />

        {/* Movies OffCanvas */}
        <div class="offcanvas offcanvas-top off-canvas-movie" tabindex="-1" id="offcanvasTop" 
            aria-labelledby="offcanvasTopLabel">
            <div className="offcanvas-header movie-sheet-header">
                <div>
                    <p className='booking-kicker mb-1'>CineSaga</p>
                    <h5 className="offcanvas-title" id="offcanvasTopLabel">Explore Movies</h5>
                </div>
            </div>

            <div class="offcanvas-body">
                <div className='movie-drawer-shell'>
                    <div className='movie-drawer-grid'>
                        <section className='offcanvas-feature-card movie-drawer-feature text-start'>
                            <div className='movie-drawer-poster-wrap'>
                                    {featuredMovie?.movieImageUrl ? (
                                        <img src={featuredMovie.movieImageUrl}
                                        className="img-fluid offcanvas-poster" alt={featuredMovie?.movieName || "Featured movie"}/>
                                    ) : (
                                        <div className="offcanvas-poster-placeholder">Poster coming soon</div>
                                    )}
                            </div>
                            <div className='movie-drawer-copy'>
                                    <p className="small text-uppercase text-gold mb-2">Featured Now Showing</p>
                                    <h3>{featuredMovie?.movieName || "No movie loaded yet"}</h3>
                                    <p className='last-movie-p'>{featuredMovie?.description || "Start your backend services and add movies to populate this area."}</p>
                                    <button class="slider-button btn btn-light btn-md rounded" type='button' data-bs-dismiss="offcanvas"
                                         onClick={()=> startBooking(featuredMovie?.movieId)}>
                                         <strong>Book Tickets </strong>
                                    </button>
                            </div>
                        </section>
                        <section className='offcanvas-list-panel movie-drawer-lists'>
                                <div className='movie-drawer-list-group'>
                                    <h3 className='text-start'>Now Showing</h3>
                                    <div className='mt-3'>
                                        {moviesInVision.length === 0 ? (
                                            <p className="text-muted text-start">No movies loaded.</p>
                                        ) : moviesInVision.slice(0, 6).map(movie => (
                                            <button type="button" key={movie.movieId} className='nav-movie-p text-start'
                                                data-bs-dismiss="offcanvas"
                                                onClick={() => startBooking(movie.movieId)}>
                                                {movie.movieName}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button type='button' className='movie-sheet-link' data-bs-dismiss="offcanvas" onClick={() => goToMovies("now")}><strong>View All Now Showing</strong></button>
                                </div>
                                <div className='movie-drawer-list-group'>
                                    <div className='movie-drawer-title-row'>
                                        <h3 className='text-start'>Coming Soon</h3>
                                        <button type="button" className="movie-sheet-icon-close" data-bs-dismiss="offcanvas" aria-label="Close movies menu">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                    <div className='mt-3'>
                                        {comingSoonMovies.length === 0 ? (
                                            <p className="text-muted text-start">No coming soon movies loaded.</p>
                                        ) : comingSoonMovies.slice(0, 6).map(movie => (
                                             <button type="button" key={movie.movieId} className='nav-movie-p text-start'
                                                data-bs-dismiss="offcanvas"
                                                onClick={() => goToMovie(movie.movieId)}>
                                                {movie.movieName}
                                            </button>
                                        ))}
                                    </div>
                                    <button type='button' className='movie-sheet-link' data-bs-dismiss="offcanvas" onClick={() => goToMovies("soon")}><strong>View Coming Soon</strong></button>
                                </div>
                        </section>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
  )
}

function hasRole(user, roleName) {
    return user?.roles?.some(role => role === roleName || role === "ROLE_" + roleName)
}

function closeMovieDrawer() {
    const drawer = document.getElementById("offcanvasTop")
    if (!drawer?.classList.contains("show")) {
        return
    }

    const bootstrapOffcanvas = window.bootstrap?.Offcanvas?.getInstance(drawer)
    if (bootstrapOffcanvas) {
        bootstrapOffcanvas.hide()
        return
    }

    drawer.querySelector("[data-bs-dismiss='offcanvas']")?.click()
}
