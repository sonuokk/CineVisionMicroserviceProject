import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from '../pages/LoginModal';
import RegisterModal from '../pages/RegisterModal';
import { MovieService } from '../services/movieService';
import LoggedOut from './LoggedOut';
import LoggedIn from './LoggedIn';

export default function Navbar() {

    const navigate = useNavigate()

    const movieService = useMemo(() => new MovieService(), []);

    const [moviesInVision, setMoviesInVision] = useState([])
    const [comingSoonMovies, setComingSoonMovies] = useState([])
    const [isNavbarHidden, setIsNavbarHidden] = useState(false)

    const userFromRedux = useSelector(state => state.user.payload);

    const featuredMovie = moviesInVision[0];

    const goToMovie = (movieId) => {
        if (movieId) {
            navigate("/movie/" + movieId);
        }
    }

    const openLoginModal = () => {
        setTimeout(() => {
            document.querySelector('[data-bs-target="#loginModal"]')?.click();
        }, 150);
    }

    const goToMovies = (filter) => {
        navigate(filter === "soon" ? "/#coming-soon" : "/#movies");
        window.dispatchEvent(new CustomEvent("cineSagaMovieFilter", { detail: { filter: filter === "soon" ? "soon" : "now" } }));
        setTimeout(() => {
            document.getElementById("movies")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
    }

    const startBooking = (movieId) => {
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
      
        movieService.getAllDisplayingMovies().then(result => setMoviesInVision(result.data))
        movieService.getAllComingSoonMovies().then(result => setComingSoonMovies(result.data))

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
    

  return (
    <div>
        <nav className={`navbar navbar-expand-lg navbar-light navbar-custom fixed-top ${isNavbarHidden ? "navbar-hidden" : ""}`}>
            <div class="container px-5">
            <Link to={"/"} className="navbar-brand" style={{textDecoration:"none"}}> CineSaga </Link> 
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
                <div class="collapse navbar-collapse" id="navbarResponsive">
                    <ul class="navbar-nav ms-auto align-items-center">
                        <li class="nav-item"><Link className="nav-link" to="/">Home</Link></li>
                        <li class="nav-item"><button type='button' className="nav-link nav-action-button" onClick={() => goToMovies("now")}>Now Showing</button></li>
                        <li class="nav-item"><button type='button' className="nav-link nav-action-button" onClick={() => goToMovies("soon")}>Coming Soon</button></li>
                        {userFromRedux?.roles?.some(role => role === "ADMIN" || role === "ROLE_ADMIN") ? 
                            <>
                                <li class="nav-item"><a class="nav-link" href="#!" onClick={() => navigate("/addMovie")}>Add Movie</a></li>
                                <li class="nav-item"><a class="nav-link" href="#!" onClick={() => navigate("/admin/users")}>Manage Users</a></li>
                            </>
                        : null}

                        <li class="nav-item"><button type='button' className="nav-link nav-action-button"
                        data-bs-toggle="offcanvas" data-bs-target="#offcanvasTop" aria-controls="offcanvasTop">
                            Movies</button></li>
                        
                        { userFromRedux ? <LoggedIn /> : <LoggedOut /> }
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
                <button type="button" className="movie-sheet-close" data-bs-dismiss="offcanvas" aria-label="Close movies menu">
                    <i className="fa-solid fa-xmark"></i>
                    <span>Close</span>
                </button>
            </div>

            <div class="offcanvas-body">
                <div className='container-fluid px-3 px-md-5 pb-4'>
                    <div className='row g-4 justify-content-between align-items-stretch'>
                        <div className='col-12 col-lg-6 text-white text-start'>
                            <div className='offcanvas-feature-card row g-3 align-items-center'>
                                <div className='col-12 col-sm-5'>
                                    {featuredMovie?.movieImageUrl ? (
                                        <img src={featuredMovie.movieImageUrl}
                                        className="img-fluid offcanvas-poster" alt={featuredMovie?.movieName || "Featured movie"}/>
                                    ) : (
                                        <div className="offcanvas-poster-placeholder">Poster coming soon</div>
                                    )}
                                </div>
                                <div className='col-12 col-sm-7'>
                                    <p className="small text-uppercase text-gold mb-2">Featured Now Showing</p>
                                    <h3>{featuredMovie?.movieName || "No movie loaded yet"}</h3>
                                    <p className='last-movie-p'>{featuredMovie?.description || "Start your backend services and add movies to populate this area."}</p>
                                    <button class="slider-button btn btn-light btn-md rounded" type='button' data-bs-dismiss="offcanvas"
                                         onClick={()=> startBooking(featuredMovie?.movieId)}>
                                         <strong>Book Tickets </strong>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className='col-12 col-lg-6'>
                            <div className='offcanvas-list-panel row g-4 justify-content-center align-items-start'>
                                <div className='col-12 col-md-6'>
                                    <h3 className='text-start'>Now Showing</h3>
                                    <div className='mt-3'>
                                        {moviesInVision.length === 0 ? (
                                            <p className="text-muted text-start">No movies loaded.</p>
                                        ) : moviesInVision.slice(0, 6).map(movie => (
                                            <button type="button" key={movie.movieId} className='nav-movie-p text-start'
                                                data-bs-dismiss="offcanvas"
                                                onClick={() => goToMovie(movie.movieId)}>
                                                {movie.movieName}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button type='button' className='movie-sheet-link' data-bs-dismiss="offcanvas" onClick={() => goToMovies("now")}><strong>View All Now Showing</strong></button>
                                </div>
                                <div className='col-12 col-md-6'>
                                    <h3 className='text-start'>Coming Soon</h3>
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
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
  )
}

