import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from '../pages/LoginModal';
import RegisterModal from '../pages/RegisterModal';
import { MovieService } from '../services/movieService';
import LoggedOut from './LoggedOut';
import LoggedIn from './LoggedIn';

export default function Navbar() {

    const navigate = useNavigate()

    const movieService = new MovieService();

    const [moviesInVision, setMoviesInVision] = useState([])
    const [comingSoonMovies, setComingSoonMovies] = useState([])

    const userFromRedux = useSelector(state => state.user.payload);

    const featuredMovie = moviesInVision[0];

    const goToMovie = (movieId) => {
        if (movieId) {
            navigate("/movie/" + movieId);
        }
    }

    useEffect(() => {
      
        movieService.getAllDisplayingMovies().then(result => setMoviesInVision(result.data))
        movieService.getAllComingSoonMovies().then(result => setComingSoonMovies(result.data))

    }, [])
    

  return (
    <div>
        <nav class="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
            <div class="container px-5">
            <Link to={"/"} style={{textDecoration:"none"}}>
                <a class="navbar-brand"> CineSaga </a>
            </Link> 
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
                <div class="collapse navbar-collapse" id="navbarResponsive">
                    <ul class="navbar-nav ms-auto align-items-center">
                        {userFromRedux?.roles?.some(role => role === "ADMIN" || role === "ROLE_ADMIN") ? 
                            <>
                                <li class="nav-item"><a class="nav-link" href="#!" onClick={() => navigate("/addMovie")}>Add Movie</a></li>
                                <li class="nav-item"><a class="nav-link" href="#!" onClick={() => navigate("/admin/users")}>Manage Users</a></li>
                            </>
                        : null}

                        <li class="nav-item"><a class="nav-link" href="#!"
                        data-bs-toggle="offcanvas" data-bs-target="#offcanvasTop" aria-controls="offcanvasTop">
                            Movies</a></li>
                        
                        { userFromRedux ? <LoggedIn /> : <LoggedOut /> }
                    </ul>
                </div>
            </div>
        </nav>

        {/* Login Modal */}
        <LoginModal />
        <RegisterModal />

        {/* Movies OffCanvas */}
        <div class="offcanvas offcanvas offcanvas-top off-canvas-movie" tabindex="-1" id="offcanvasTop" 
            aria-labelledby="offcanvasTopLabel">
            <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="offcanvasTopLabel">Explore Movies</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
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
                                    <a class="slider-button btn btn-light btn-md rounded" href="#!" data-bs-dismiss="offcanvas"
                                         onClick={()=> goToMovie(featuredMovie?.movieId)}>
                                         <strong>Book Tickets </strong>
                                    </a>
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
                                    
                                    <a href='#!' className='text-decoration-none' data-bs-dismiss="offcanvas" onClick={() => navigate("/")}><strong> View All </strong> </a>
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
                                    <a href='#!' className='text-decoration-none' data-bs-dismiss="offcanvas" onClick={() => navigate("/")}><strong> View All </strong> </a>
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

