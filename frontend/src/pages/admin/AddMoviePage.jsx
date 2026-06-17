import React, { useEffect, useMemo, useState } from 'react'
import { Formik, Form } from "formik";
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CategoryService } from '../../services/categoryService';
import { DirectorService } from '../../services/directorService';
import { MovieService } from '../../services/movieService';
import KaanKaplanSelect from '../../utils/customFormItems/KaanKaplanSelect';
import KaanKaplanTextInput from '../../utils/customFormItems/KaanKaplanTextInput';
import KaanKaplanTextArea from '../../utils/customFormItems/KaanKaplanTextArea';
import KaanKaplanCheckBox from '../../utils/customFormItems/KaanKaplanCheckBox';

const initialMovieValues = {
    movieName: "",
    description: "",
    duration: "",
    releaseDate: "",
    trailerUrl: "",
    categoryId: "",
    categoryName: "",
    directorId: "",
    directorName: "",
    isInVision: false
}

const OTHER_VALUE = "__other__";
const POPULAR_GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Family", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller"];
const POPULAR_DIRECTORS = ["Christopher Nolan", "Denis Villeneuve", "Greta Gerwig", "James Cameron", "Martin Scorsese", "Rajkumar Hirani", "S. S. Rajamouli", "Sanjay Leela Bhansali", "Zoya Akhtar"];

export default function AddMoviePage() {

    const userFromRedux = useSelector(state => state.user.payload)
    const navigate = useNavigate()

    const categoryService = useMemo(() => new CategoryService(), []);
    const directorService = useMemo(() => new DirectorService(), []);
    const movieService = useMemo(() => new MovieService(), []);

    const [categories, setCategories] = useState([])
    const [directors, setDirectors] = useState([])
    const [movies, setMovies] = useState([])
    const [loadingMovies, setLoadingMovies] = useState(false)

    const genreOptions = useMemo(() => buildChoiceOptions(categories, "categoryId", "categoryName", POPULAR_GENRES), [categories])
    const directorOptions = useMemo(() => buildChoiceOptions(directors, "directorId", "directorName", POPULAR_DIRECTORS), [directors])

    useEffect(() => {
        categoryService.getall().then(result => setCategories(result.data || [])).catch(() => setCategories([]))
        directorService.getall().then(result => setDirectors(result.data || [])).catch(() => setDirectors([]))
        loadMovies()
    }, [categoryService, directorService, movieService])

    function loadMovies() {
        setLoadingMovies(true)
        movieService.getAllMovies()
            .then(result => setMovies(result.data || []))
            .catch(() => {
                Promise.all([
                    movieService.getAllDisplayingMovies().then(result => result.data || []).catch(() => []),
                    movieService.getAllComingSoonMovies().then(result => result.data || []).catch(() => [])
                ]).then(([nowShowing, comingSoon]) => setMovies([...nowShowing, ...comingSoon]))
            })
            .finally(() => setLoadingMovies(false))
    }

    function addMovie(values, helpers) {
        const selectedGenreName = getSelectedName(values.categoryId, values.categoryName)
        const selectedDirectorName = getSelectedName(values.directorId, values.directorName)
        const missingRequired = !values.movieName || !values.description || !values.duration || !values.releaseDate || !values.trailerUrl || !values.categoryId
        if (missingRequired) {
            toast.warning("Complete title, synopsis, runtime, release date, trailer URL, and genre.", {
                theme: "colored",
                position: "top-center"
            })
            return
        }

        if ((values.categoryId === OTHER_VALUE || values.categoryId?.startsWith("new:")) && !selectedGenreName) {
            toast.warning("Choose a genre or enter a new genre name.", {
                theme: "colored",
                position: "top-center"
            })
            return
        }

        if (!values.directorId || ((values.directorId === OTHER_VALUE || values.directorId?.startsWith("new:")) && !selectedDirectorName)) {
            toast.warning("Choose a director or enter a new director name.", {
                theme: "colored",
                position: "top-center"
            })
            return
        }

        const saveMovie = (payload) => movieService.addMovie(payload).then(result => {
            if (result.data) {
                toast.success("Movie added. Continue setup to attach cast and cities.", {
                    theme: "colored",
                    position: "top-center"
                })
                helpers.resetForm()
                loadMovies()
                navigate("/addMovie/" + result.data.movieId)
            }
        })

        const categoryRequest = resolveChoice(values.categoryId, selectedGenreName, (name) => categoryService.add({
            categoryName: name,
            token: userFromRedux?.token
        }).then(result => result.data.categoryId))

        const directorRequest = resolveChoice(values.directorId, selectedDirectorName, (name) => directorService.add({
            directorName: name,
            token: userFromRedux?.token
        }).then(result => result.data.directorId))

        const request = Promise.all([categoryRequest, directorRequest]).then(([categoryId, directorId]) => saveMovie({
            ...values,
            categoryId,
            directorId,
            userAccessToken: userFromRedux?.token
        }))

        request.catch(error => toast.error(getErrorMessage(error, "Could not add movie."), {
            theme: "colored",
            position: "top-center"
        }))
    }

    function deleteMovie(movie) {
        if (!window.confirm(`Delete ${movie.movieName}? This also removes related showtimes, reviews, bookings, and payments.`)) {
            return
        }

        movieService.deleteMovie(movie.movieId)
            .then(() => {
                toast.success(`${movie.movieName} was deleted.`, {
                    theme: "colored",
                    position: "top-center"
                })
                loadMovies()
            })
            .catch(error => toast.error(getErrorMessage(error, "Could not delete movie."), {
                theme: "colored",
                position: "top-center"
            }))
    }

    const nowShowingCount = movies.filter(movie => movie.display || movie.isDisplay).length
    const comingSoonCount = movies.length - nowShowingCount

    return (
        <div className='admin-page manage-movies-page container py-5 mt-5'>
            <div className='admin-users-shell'>
                <div className='admin-users-header'>
                    <div>
                        <p className='booking-kicker'>Admin</p>
                        <h2>Manage Movies</h2>
                        <p className='text-muted'>Add movies, continue setup for cast and cities, or remove movies from the catalog.</p>
                    </div>
                    <div className='admin-users-stats'>
                        <span><strong>{movies.length}</strong> movies</span>
                        <span><strong>{nowShowingCount}</strong> now showing</span>
                        <span><strong>{comingSoonCount}</strong> coming soon</span>
                    </div>
                </div>

                <section className='manage-movies-grid'>
                    <div className='manage-movie-form-panel'>
                        <div className='profile-panel-header'>
                            <div>
                                <p className='booking-kicker'>Create</p>
                                <h3>Add Movie</h3>
                            </div>
                        </div>

                        <Formik initialValues={initialMovieValues} onSubmit={addMovie}>
                            {({ values }) => <Form className='manage-movie-form'>
                                <div className="form-floating">
                                    <KaanKaplanTextInput type="text" name='movieName' className="form-control" id="movieName" placeholder="Movie Title" />
                                    <label htmlFor="movieName">Movie Title</label>
                                </div>
                                <div className="form-floating">
                                    <KaanKaplanTextArea name='description' className="form-control" id="movieDescription" placeholder="Synopsis" />
                                    <label htmlFor="movieDescription">Movie Synopsis</label>
                                </div>
                                <div className='manage-form-row'>
                                    <div className="form-floating">
                                        <KaanKaplanTextInput name='duration' type="number" className="form-control" id="duration" placeholder="Runtime" />
                                        <label htmlFor="duration">Runtime</label>
                                    </div>
                                    <div className="form-floating">
                                        <KaanKaplanTextInput name='releaseDate' type="date" className="form-control" id="releaseDate" placeholder="Release Date" />
                                        <label htmlFor="releaseDate">Release Date</label>
                                    </div>
                                </div>
                                <div className="form-floating">
                                    <KaanKaplanTextInput name='trailerUrl' type="text" className="form-control" id="trailerUrl" placeholder="Trailer Url" />
                                    <label htmlFor="trailerUrl">Trailer Url</label>
                                </div>
                                <div className='manage-form-row'>
                                    <div className="form-floating">
                                        <KaanKaplanSelect
                                            id="categoryId"
                                            className="form-select form-select-lg"
                                            name="categoryId"
                                            placeholder="Choose genre"
                                            options={genreOptions}
                                        />
                                        <label htmlFor="categoryId">Genre</label>
                                    </div>
                                    <div className="form-floating">
                                        <KaanKaplanSelect
                                            id="directorId"
                                            className="form-select form-select-lg"
                                            name="directorId"
                                            placeholder="Choose director"
                                            options={directorOptions}
                                        />
                                        <label htmlFor="directorId">Director</label>
                                    </div>
                                </div>
                                {values.categoryId === OTHER_VALUE ? (
                                    <div className="form-floating">
                                        <KaanKaplanTextInput name='categoryName' type="text" className="form-control" id="categoryName" placeholder="Genre Name" />
                                        <label htmlFor="categoryName">Other Genre Name</label>
                                    </div>
                                ) : null}
                                {values.directorId === OTHER_VALUE ? (
                                    <div className="form-floating">
                                        <KaanKaplanTextInput name='directorName' type="text" className="form-control" id="directorName" placeholder="Director Name" />
                                        <label htmlFor="directorName">Other Director Name</label>
                                    </div>
                                ) : null}
                                <label className="manage-checkbox-row">
                                    <KaanKaplanCheckBox name="isInVision" className="form-check-input" type="checkbox" id="isInVision" />
                                    <span>Movie is now showing</span>
                                </label>
                                <button type="submit" className="btn btn-primary">Add Movie & Continue Setup</button>
                            </Form>}
                        </Formik>
                    </div>

                    <div className='manage-movie-list-panel'>
                        <div className='profile-panel-header'>
                            <div>
                                <p className='booking-kicker'>Library</p>
                                <h3>Movie Catalog</h3>
                            </div>
                            <button type='button' className='btn btn-outline-dark' onClick={loadMovies} disabled={loadingMovies}>
                                {loadingMovies ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>
                        <div className='manage-movie-list'>
                            {movies.length === 0 ? (
                                <p className='profile-muted text-start'>No movies loaded.</p>
                            ) : movies.map(movie => (
                                <article className='manage-movie-card' key={movie.movieId}>
                                    <div className='manage-movie-poster'>
                                        {movie.movieImageUrl ? <img src={movie.movieImageUrl} alt={movie.movieName} /> : <span>No Poster</span>}
                                    </div>
                                    <div className='manage-movie-copy'>
                                        <span className={`ticket-status-pill ${movie.display || movie.isDisplay ? "" : "muted"}`}>
                                            {movie.display || movie.isDisplay ? "NOW SHOWING" : "COMING SOON"}
                                        </span>
                                        <h4>{movie.movieName}</h4>
                                        <p>{movie.categoryName || "Uncategorized"} • {movie.duration || 0} min</p>
                                    </div>
                                    <div className='manage-movie-actions'>
                                        <button type='button' className='btn btn-outline-dark' onClick={() => navigate("/movie/" + movie.movieId)}>View</button>
                                        <button type='button' className='btn btn-outline-dark' onClick={() => navigate("/addMovie/" + movie.movieId)}>Setup</button>
                                        <button type='button' className='btn btn-outline-danger' onClick={() => deleteMovie(movie)}>Delete</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
            <ToastContainer />
        </div>
    )
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
    const fieldMessage = Object.values(data).find(value => typeof value === "string" && value.trim());
    return fieldMessage || fallback;
}

function buildChoiceOptions(items, idKey, nameKey, popularNames) {
    const existingNames = new Set((items || []).map(item => normalizeName(item?.[nameKey])));
    const existingOptions = (items || [])
        .filter(item => item?.[idKey] && item?.[nameKey])
        .map(item => ({ key: String(item[idKey]), value: item[nameKey] }));
    const popularOptions = popularNames
        .filter(name => !existingNames.has(normalizeName(name)))
        .map(name => ({ key: `new:${name}`, value: name }));
    return [...existingOptions, ...popularOptions, { key: OTHER_VALUE, value: "Other" }];
}

function normalizeName(name) {
    return (name || "").trim().toLowerCase();
}

function getSelectedName(choice, otherName) {
    if (choice === OTHER_VALUE) {
        return (otherName || "").trim();
    }
    if (choice?.startsWith("new:")) {
        return choice.slice(4).trim();
    }
    return "";
}

function resolveChoice(choice, selectedName, createChoice) {
    if (choice === OTHER_VALUE || choice?.startsWith("new:")) {
        return createChoice(selectedName);
    }
    return Promise.resolve(Number(choice));
}
