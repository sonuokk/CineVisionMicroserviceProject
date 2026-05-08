import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper";
import { ActorService } from '../services/actorService';
import { CityService } from '../services/cityService';
import { MovieService } from '../services/movieService';
import dateConvert from '../utils/dateConverter';
import dateConvertForTicket from '../utils/dateConvertForTicket';
import { SaloonTimeService } from '../services/saloonTimeService';
import { useDispatch, useSelector } from 'react-redux';
import { addMovieToState, cleanState } from '../store/actions/movieActions';
import { CommentService } from '../services/commentService';
import { toast, ToastContainer } from 'react-toastify';
import { allDemoMovies, getDemoMovieById } from '../data/demoMovies';

const SIGN_IN_TOAST_ID = "sign-in-before-booking";


export default function DetailPage() {
    let {movieId} = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const userFromRedux = useSelector(state => state.user.payload);

    let date = new Date();

    const movieService = new MovieService()
    const cityService = new CityService()
    const actorService = new ActorService()
    const saloonTimeService = new SaloonTimeService();
    const commentService = new CommentService();

    const [movie, setMovie] = useState({})
    const [actors, setActors] = useState([])
    const [otherMovies, setOtherMovies] = useState([])
    const [cinemaSaloons, setCinemaSaloons] = useState([])
    const [selectedCity, setSelectedCity] = useState(null)
    const [selectedSaloon, setSelectedSaloon] = useState(null)
    const [saloonTimes, setSaloonTimes] = useState([])
    const [selectedDay, setSelectedDay] = useState(dateConvert(date))
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState("")
    const [countOfComments, setCountOfComments] = useState(0)
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState("tickets");

    useEffect(() => {
        getNewVisionMovie(movieId);
    }, [])
    
    function getNewVisionMovie(movieId) {
        setActiveTab("tickets");
        setSelectedCity(null);
        setSelectedSaloon(null);
        setSaloonTimes([]);
        const fallbackMovie = getDemoMovieById(movieId) || {};
        movieService.getMovieById(movieId)
            .then(result => setMovie(result.data?.movieId ? result.data : fallbackMovie))
            .catch(() => setMovie(fallbackMovie));
        actorService.getActorsByMovieId(movieId).then(result => setActors(result.data)).catch(() => setActors([]))
        cityService.getCitiesByMovieId(movieId).then(result => setCinemaSaloons(result.data)).catch(() => setCinemaSaloons([]))
        movieService.getAllDisplayingMovies().then(result => {
            const films = result.data.filter(m => m.movieId != movieId);
            setOtherMovies(films);
        }).catch(() => setOtherMovies(allDemoMovies.filter(m => String(m.movieId) !== String(movieId))))
        commentService.getCountOfComments(movieId).then(result => setCountOfComments(result.data)).catch(() => setCountOfComments(0));
        getComments(movieId, 1, 5);
    }

    function getSaloonTimes(saloonId, movieId) {
        saloonTimeService.getMovieSaloonTimeSaloonAndMovieId(saloonId, movieId).then(result => {
            setSaloonTimes(result.data);
        })
    }

    function selectCity(city) {
        setSelectedCity(city);
        setSelectedSaloon(null);
        setSaloonTimes([]);
    }

    function selectSaloon(saloon) {
        setSelectedSaloon(saloon);
        getSaloonTimes(saloon.saloonId, movieId);
    }

    function getComments(movieId, pageNo, pageSize=5) {
        commentService.getCommentsByMovieId(movieId, pageNo, pageSize).then(result => {
            if (comments.length > 0 && pageNo > 1) {
                setComments([...comments, ...result.data])
            }else {
                setComments(result.data)
            }
        }).catch(() => setComments([]))
    }

    function addState(movieTime) {
        if (!userFromRedux) {
            openLoginModal();
            return;
        }

        dispatch(cleanState());

        let movieDto = {
            id: movie.movieId,
            movieName: movie.movieName,
            imageUrl: movie.movieImageUrl,
            saloonId: selectedSaloon.saloonId,
            saloonName: selectedSaloon.saloonName,
            movieDay: selectedDay,
            movieTime: movieTime
        }
        dispatch(addMovieToState(movieDto));
        navigate("buyTicket")
    }

    function openLoginModal() {
        sessionStorage.setItem("cineSagaPendingPath", "/movie/" + movieId);
        if (!toast.isActive(SIGN_IN_TOAST_ID)) {
            toast.warning("Please sign in before booking tickets.", {
                toastId: SIGN_IN_TOAST_ID,
                theme: "light",
                position: "top-center"
            });
        }
        document.querySelector('[data-bs-target="#loginModal"]')?.click();
    }

    function sendCommentText() {

        if(userFromRedux) {
            if(commentText.trim().length > 0) {
                let commentDto = {
                    commentByUserId: userFromRedux.userId,
                    commentText: commentText,
                    commentBy: userFromRedux.fullName,
                    token: userFromRedux.token,
                    movieId: movieId
                }
                
                commentService.addComment(commentDto).then(result => {
                    if(result.status == 200) {
                        document.querySelector("#commentArea").value = "";
                        setComments([...comments, result.data])
                        toast.success("Your review eklendi!", {
                            theme: "light",
                            position: "top-center"
                        });
                    }
                })

            } else {
                toast.warning("Your review cannot be empty!", {
                    theme: "light",
                    position: "top-center"
                });
            }
        } else {
            toast.error("Please sign in to write a review!", {
                theme: "light",
                position: "top-center"
            });
        }
    }

    function deleteComment(commentId) {
        let deleteCommentDto = {
            commentId: commentId,
            token: userFromRedux.token
        }
        commentService.deleteComment(deleteCommentDto).then(result => {
            if(result.status == 200){
                let newComments = comments.filter(c => c.commentId != commentId);
                setComments(newComments);
            }
        })
    }

  return (
    <div>
        <section id="entry-section" className='detail-bg pt-5'>
            <div className='container mt-5'>
                <div className='detail-hero-card row gx-4 gy-4 pt-2 justify-content-center align-items-center'>
                    <div className='col-12 col-lg-5 text-center detail-poster-column' >
                        {movie?.movieImageUrl ? (
                            <img className='detail-poster' src={movie.movieImageUrl} alt={movie?.movieName || "Movie poster"} />
                        ) : (
                            <div className="detail-poster-placeholder">Poster coming soon</div>
                        )}
                    </div>
                    <div className='col-12 col-lg-7 text-start text-light detail-copy-column'>
                        <p className="detail-kicker">{movie?.isDisplay === false ? "Coming Soon" : "Now Showing"}</p>
                        <h3>{movie?.movieName}</h3>
                        <p className="detail-description">{movie?.description || "Movie details will be updated soon."}</p>
                        <div className="detail-meta-row">
                            <span>{movie.releaseDate ? dateConvert(movie.releaseDate) : "Date TBA"}</span>
                            <span>{movie.duration ? `${movie.duration} min` : "Runtime TBA"}</span>
                            <span>{movie.categoryName || "Genre TBA"}</span>
                        </div>
                        <div className="detail-credit-card">
                            <p><strong>Director</strong><span>{movie?.directorName || "Not assigned yet"}</span></p>
                            <p><strong>Cast</strong><span>{actors?.length > 0 ? actors.map(actor => actor.actorName).join(", ") : "Not assigned yet"}</span></p>
                        </div>
                        <div className="movie-detail-tabs mt-4" role="tablist" aria-label="Movie detail tabs">
                            <button className={`detail-page-btn btn btn-lg ${activeTab === "tickets" ? "active" : ""}`} type="button"
                                onClick={() => userFromRedux ? setActiveTab("tickets") : openLoginModal()}>Book Tickets</button>
                            <button className={`detail-page-btn btn btn-lg ${activeTab === "reviews" ? "active" : ""}`} type="button"
                                onClick={() => setActiveTab("reviews")}>Reviews</button>
                            <button className={`detail-page-btn btn btn-lg ${activeTab === "trailer" ? "active" : ""}`} type="button"
                                onClick={() => setActiveTab("trailer")}>Trailer</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* for css ::after property */}
        <style dangerouslySetInnerHTML={{
            __html: [
                '.detail-bg:after {',
                '  content: "Hello";',
                '  position: absolute;',                
                'z-index: -1;',
                'inset: 0;',
                `background-image: url(${movie?.movieImageUrl});`, 
                'background-repeat: no-repeat;',
                'background-size: cover;',
                'background-position: top center;',
                'opacity: 0.8;',
                '-webkit-filter: blur(8px) saturate(1);',
                '}'
                ].join('\n')
            }}>
        </style>

        <section className='p-5 movie-info-section'>
            <div className='container'>
                <div className='row justify-content-between ms-0 ms-md-5 ps-0 ps-md-5'>
                    <div className='col-sm-4 text-start'>
                        <p> <strong> Release Date: </strong> {movie.releaseDate ? dateConvert(movie.releaseDate) : "Date TBA"}</p>
                        <p> <strong>Runtime: </strong>{movie.duration ? `${movie.duration} Minutes` : "Runtime TBA"}</p>
                        <p><strong>Genre: </strong>{movie.categoryName || "Genre TBA"}</p>
                    </div>
                    <div className='col-sm-8 text-start'>
                        <p><strong>Synopsis: </strong>{movie.description}</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Ticket Buy Section */}
        {activeTab === "tickets" ? (
        <section id="ticketBuy" className='pt-1 pb-3'>
            <div className='container bg-primary rounded'>
                <div className='row p-5'>
                    <div className='col-sm-4 mt-2 text-sm-start text-md-end text-light'>
                        <h2>Book Tickets</h2>
                    </div>
                    <div className='col-sm-8 ps-3 mt-2'>
                        <button type="button" class="select-saloon-button btn btn-primary col-12"
                         data-bs-toggle={userFromRedux ? "modal" : undefined}
                         data-bs-target={userFromRedux ? "#saloonModal" : undefined}
                         onClick={() => {
                            if (!userFromRedux) {
                                openLoginModal();
                            }
                         }}>
                            <span>
                                <strong>{selectedSaloon ? selectedSaloon.saloonName : selectedCity ? `Choose theater in ${selectedCity.cityName}` : "Choose City & Theater"}</strong>
                                {selectedCity && !selectedSaloon ? <small>{selectedCity?.saloon?.length || 0} theaters available</small> : null}
                                {selectedSaloon ? <small>{selectedCity?.cityName}</small> : null}
                            </span>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
            </div>
        </section>
        ) : null}

        {/* Ticket Detail Section */}
        {activeTab === "tickets" && selectedSaloon ? (
            <section id="ticketDetailSection" className='px-5 py-1 pb-5'>
                <hr />
                <div className='container py-2'>
                    <ul class="nav justify-content-center">
                        {
                            [0,1,2,3,4,5,6].map((i) => (
                                <li class="nav-item">
                                    <a class="nav-link active date-converter-ticket" aria-current="page"
                                         href="#!" onClick={() => setSelectedDay( dateConvert(new Date().setDate(date.getDate() + i)) )}>
                                        {dateConvertForTicket(new Date().setDate(date.getDate() + i))}
                                    </a>
                                </li>
                            ))
                        }
                    </ul>
                    
                </div>
                <hr />

                <div className='container bg-primary rounded'>
                    <h3 className='text-light p-3'>{selectedSaloon?.saloonName}</h3>
                </div>
                <div className='container pb-4'>
                    {saloonTimes?.map(time => (
                        <button className='saloonTime-btn btn btn-outline-dark mx-2 mt-3'
                            onClick={() => addState(time.movieBeginTime)}>
                            <strong>{time.movieBeginTime} </strong>
                        </button>
                    ))}
                </div>
                <hr />

            </section>
        ): null}


        {/* Review Section */}
        {activeTab === "reviews" ? (
        <section id="commentSection" className='pt-5 pb-5 px-2'>
            <div className='container'>
                <div className='row gy-2 justify-content-start align-items-start'>
                    <div className='col-sm-12 col-md-6 text-start'>
                       <h3>Reviews</h3>
                       {/* List reviews */}
                       <div style={{height: "200px", overflow:"scroll",overflowX: "hidden"}}>
                            {comments.length == 0 ? (
                                <p className='lead mt-4'>Be the first to review</p>
                            ): null}

                            {comments.map(comment => (
                                <div className='row align-items-center'>
                                    <div className='col-sm-10'>
                                        <p className='lead mt-4'>{comment.commentText}</p>
                                        <p className='small mt-0'>{comment.commentBy}</p>
                                    </div>
                                    {userFromRedux && comment.commentByUserId == userFromRedux.userId ? 
                                        <div className='col-sm-2'>
                                            <p className='small mb-0' onClick={() => {deleteComment(comment.commentId)}}> 
                                                <i class="fa-solid fa-xmark" ></i>
                                            </p>
                                        </div>
                                        :
                                        null
                                    }
                                </div>
                            ))}
                            <hr />
                            <div className='text-center'>
                                {currentPage < Math.ceil(countOfComments / 5) && countOfComments > 5 ?
                                    <a href='#!' className='a-pagination lead mt-4'
                                        onClick={() => {
                                            getComments(movieId, currentPage + 1)
                                            setCurrentPage(currentPage+1)
                                        }}>Show more</a>
                                : null}
                            </div> 
                       </div>


                    </div>
                    <div className='col-sm-12 col-md-6 text-start'>
                        <h3>Review</h3>
                            <textarea id="commentArea" className='text-dark mb-3' placeholder='Your review' onChange={(e) => setCommentText(e.target.value)} ></textarea>
                            <button class="comment-btn btn btn-dark btn-lg col-12" type="button" onClick={() => sendCommentText()}><strong>Submit</strong></button>
                    </div>
                </div>
            </div>
        </section>
        ) : null}

        {/* Trailer Section */}
        {activeTab === "trailer" ? (
        <section id="trailerSection" className='py-5 px-2'>
            <div className='container'>
                <div className='row justify-content-center'>
                    <div className='col-12 col-lg-10'>
                        <h3 className='text-center mb-4'>Trailer</h3>
                        {movie.movieTrailerUrl ? (
                            <div className="ratio ratio-16x9 trailer-frame">
                                <iframe title={`${movie.movieName || "Movie"} trailer`} id='videoPlayer'
                                    src={movie.movieTrailerUrl + "?autoplay=0"} allowFullScreen>
                                </iframe>
                            </div>
                        ) : (
                            <div className="empty-state-card">
                                Trailer URL is not available yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
        ) : null}

        {/* Other Movies */}
        <section className='p-5'>
            
            <h3 className='text-center mb-4'>More Now Showing Movies</h3>
            <Swiper
                slidesPerView={1}
                spaceBetween={0}
                breakpoints={{
                    576: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1200: { slidesPerView: 5 }
                }}
                pagination={{
                    clickable: true,
                }}
                modules={[Pagination]}
                className="mySwiper movie-slider"
            >
                {otherMovies.map(movie => (
                    <SwiperSlide key={movie.movieId} >
                            <div className='slider-item' onClick={()=> {
                                navigate("/movie/" + movie.movieId)
                                getNewVisionMovie(movie.movieId);
                                document.querySelector("#entry-section").scrollIntoView({
                                    behavior: "smooth"
                                })
                            }}>
                            <div className='slider-item-caption d-flex align-items-end justify-content-center h-100 w-100'>
                                <div class="d-flex align-items-center flex-column mb-3" style={{height: "20rem"}}>
                                    <div class="mb-auto pt-5 text-white"><h3> {movie.movieName} </h3></div>
                                    <div class="p-2 d-grid gap-2">
                                        <a className="slider-button btn btn-light btn-md rounded d-none d-sm-block"
                                            onClick={()=> {
                                                navigate("/movie/" + movie.movieId)
                                                getNewVisionMovie(movie.movieId);
                                            }}>
                                            <strong>Review </strong>
                                        </a>
                                        <a class="slider-button btn btn-light btn-md rounded d-none d-sm-block"
                                            onClick={()=> {
                                                navigate("/movie/" + movie.movieId)
                                                getNewVisionMovie(movie.movieId);
                                            }}>
                                            <strong> Book Tickets </strong>
                                        </a>
                                    </div>
                                
                                </div>
                            </div>
                            <img src={movie.movieImageUrl}
                                class="img-fluid mx-2" alt="..."/>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>


        {/* MovieTrailer Modal */}

        <div class="modal fade" id="movieTrailerModal" tabindex="-1" aria-labelledby="movieTrailerLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="movieTrailerLabel">Trailer</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => {
                        let player = document.getElementById("modalVideoPlayer").getAttribute("src");
                        document.getElementById("modalVideoPlayer").setAttribute("src", player);
                    }}></button>
                </div>
                <div id='modalBody' class="modal-body">
                    <iframe id='modalVideoPlayer' title={`${movie.movieName || "Movie"} trailer modal`} width="100%" height="500rem" frameborder="0" 
                        src={movie.movieTrailerUrl + "?autoplay=0"}>
                    </iframe>
                </div>
                
                </div>
            </div>
        </div>

        {/* City Modal */}
        <div class="modal fade city-theater-modal" id="saloonModal" tabindex="-1" aria-labelledby="saloonModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" >
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <p className="modal-kicker mb-1">Location</p>
                            <h5 class="modal-title" id="saloonModalLabel">Choose your city</h5>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        {cinemaSaloons?.length > 0 ? (
                            <div className="city-choice-grid">
                                {cinemaSaloons.map(city => (
                                    <button className={`city-choice-card ${selectedCity?.cityId === city.cityId ? "active" : ""}`} type="button"
                                        key={city.cityId}
                                        data-bs-target="#saloonModal2" data-bs-toggle="modal" data-bs-dismiss="modal"
                                        onClick={() => selectCity(city)}>
                                        <span className="city-choice-icon"><i class="fa-solid fa-location-dot"></i></span>
                                        <span>
                                            <strong>{city.cityName}</strong>
                                            <small>{city?.saloon?.length || 0} theaters</small>
                                        </span>
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-card">No cities are available for this movie yet.</div>
                        )}
                    
                    </div>
            
                </div>
            </div>
        </div>

        {/* Theater Modal */}
        <div class="modal fade city-theater-modal" id="saloonModal2" aria-hidden="true" aria-labelledby="saloonModal2ToggleLabel2" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" className="modal-back-btn" data-bs-target="#saloonModal" data-bs-toggle="modal" data-bs-dismiss="modal" aria-label="Back to city list">
                            <i class="fa-sharp fa-solid fa-chevron-left"></i>
                        </button>
                        <div className="flex-grow-1">
                            <p className="modal-kicker mb-1">Theaters</p>
                            <h5 class="modal-title" id="saloonModal2ToggleLabel2">{selectedCity?.cityName || "Choose city"}</h5>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        {selectedCity?.saloon?.length > 0 ? (
                            <div className="theater-choice-list">
                                {selectedCity.saloon.map(s => (
                                    <button className={`theater-choice-card ${selectedSaloon?.saloonId === s.saloonId ? "active" : ""}`} type="button"
                                        key={s.saloonId}
                                        onClick={() => selectSaloon(s)}
                                        data-bs-dismiss="modal">
                                        <span className="theater-choice-icon"><i class="fa-solid fa-clapperboard"></i></span>
                                        <span>
                                            <strong>{s.saloonName}</strong>
                                            <small>Shows available today</small>
                                        </span>
                                        <i class="fa-solid fa-check"></i>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-card">No theaters are available in this city yet.</div>
                        )}
                    </div>
                    
                </div>
            </div>
        </div>
        <ToastContainer />
    </div>
  )
}

