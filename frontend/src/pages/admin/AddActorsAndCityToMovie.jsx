import { Form, Formik } from 'formik';
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { ActorService } from '../../services/actorService';
import { CityService } from '../../services/cityService';
import { MovieImageService } from '../../services/movieImageService';
import KaanKaplanTextInput from '../../utils/customFormItems/KaanKaplanTextInput'

const POPULAR_ACTORS = [
    "Shah Rukh Khan", "Deepika Padukone", "Amitabh Bachchan", "Alia Bhatt", "Ranbir Kapoor",
    "Rajinikanth", "Prabhas", "Allu Arjun", "Tom Cruise", "Zendaya", "Leonardo DiCaprio"
]

const POPULAR_INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
    "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
    "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
    "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
    "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur",
    "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati",
    "Chandigarh", "Solapur", "Hubballi", "Mysuru", "Tiruchirappalli", "Bareilly"
]

export default function AddActorsAndCityToMovie() {
    const { movieId } = useParams();
    const navigate = useNavigate()
    const userFromRedux = useSelector(state => state.user.payload)

    const cityService = useMemo(() => new CityService(), []);
    const actorService = useMemo(() => new ActorService(), []);
    const movieImageService = useMemo(() => new MovieImageService(), []);

    const [cities, setCities] = useState([])
    const [actors, setActors] = useState([])

    useEffect(() => {
        cityService.getall().then(result => {
            const cityNames = uniqueNames([
                ...POPULAR_INDIAN_CITIES,
                ...(result.data || []).map(city => city?.cityName)
            ])
            setCities(cityNames)
        }).catch(() => setCities(POPULAR_INDIAN_CITIES))

        actorService.getall().then(result => {
            const actorNames = uniqueNames([
                ...POPULAR_ACTORS,
                ...(result.data || []).map(actor => actor?.actorName)
            ])
            setActors(actorNames)
        }).catch(() => setActors(POPULAR_ACTORS))
    }, [actorService, cityService])

    return (
        <div className='admin-page movie-setup-page container py-5 mt-5'>
            <div className='admin-users-shell'>
                <div className='admin-users-header'>
                    <div>
                        <p className='booking-kicker'>Movie Setup</p>
                        <h2>Finish Movie Setup</h2>
                        <p className='text-muted'>Add the poster, choose cast members, and select the cities where this movie will open.</p>
                    </div>
                    <div className='admin-users-stats'>
                        <span><strong>1</strong> poster</span>
                        <span><strong>Cast</strong> names</span>
                        <span><strong>Cities</strong> launch</span>
                    </div>
                </div>

                <Formik
                    initialValues={{ actors: [], actorName: "", imageUrl: "", cities: [], cityName: "" }}
                    onSubmit={async (values) => {
                        const typedActors = splitNames(values.actorName);
                        const selectedActors = asArray(values.actors);
                        const typedCities = splitNames(values.cityName);
                        const selectedCities = asArray(values.cities);
                        const actorNameList = uniqueNames([...selectedActors, ...typedActors]);
                        const cityNameList = uniqueNames([...selectedCities, ...typedCities]);

                        if (actorNameList.length === 0 || cityNameList.length === 0 || !values.imageUrl?.trim()) {
                            toast.warning("Add at least one cast member, one city, and a poster image URL.", {
                                theme: "colored",
                                position: "top-center"
                            });
                            return;
                        }

                        try {
                            await actorService.addActor({
                                movieId,
                                actorNameList,
                                token: userFromRedux.token
                            });
                            await movieImageService.addMovieImage({
                                movieId,
                                imageUrl: values.imageUrl.trim(),
                                token: userFromRedux.token
                            });
                            await cityService.addCity({
                                movieId,
                                cityNameList,
                                token: userFromRedux.token
                            });
                            toast.success("Movie setup saved.", { theme: "colored", position: "top-center" });
                            navigate("/addMovie");
                        } catch (error) {
                            toast.error(error.response?.data?.message || "Could not finish movie setup.", {
                                theme: "colored",
                                position: "top-center"
                            });
                        }
                    }}>
                    {({ values, setFieldValue }) => <Form className='movie-setup-grid'>
                        <section className='manage-movie-form-panel'>
                            <div className='profile-panel-header'>
                                <div>
                                    <p className='booking-kicker'>Poster</p>
                                    <h3>Movie Artwork</h3>
                                </div>
                            </div>
                            <div className='movie-artwork-preview'>
                                {values.imageUrl ? (
                                    <img src={values.imageUrl} alt='Selected movie artwork preview' />
                                ) : (
                                    <div>
                                        <i className='fa-regular fa-image'></i>
                                        <span>Preview appears here</span>
                                    </div>
                                )}
                            </div>
                            <div className='form-floating'>
                                <KaanKaplanTextInput name='imageUrl' type='url' className='form-control' id='imageUrl' placeholder='Poster Image URL' />
                                <label htmlFor='imageUrl'>Poster Image URL</label>
                            </div>
                            <label className='poster-upload-button'>
                                <i className='fa-solid fa-upload'></i>
                                <span>Upload poster image</span>
                                <input type='file' accept='image/*' onChange={event => handlePosterFile(event, setFieldValue)} />
                            </label>
                            <p className='profile-muted text-start'>Paste a public image URL or upload a poster to preview it before saving.</p>
                        </section>

                        <section className='manage-movie-form-panel'>
                            <div className='profile-panel-header'>
                                <div>
                                    <p className='booking-kicker'>Cast</p>
                                    <h3>Actors</h3>
                                </div>
                            </div>
                            <MultiChoiceList
                                options={actors}
                                selected={values.actors}
                                onToggle={(actor) => toggleChoice(values.actors, actor, nextValue => setFieldValue("actors", nextValue))}
                            />
                            <div className='form-floating'>
                                <KaanKaplanTextInput type='text' name='actorName' className='form-control' id='actorName' placeholder='Other Actors' />
                                <label htmlFor='actorName'>Other Actors</label>
                            </div>
                            <p className='profile-muted text-start'>Type missing names separated by commas.</p>
                        </section>

                        <section className='manage-movie-form-panel'>
                            <div className='profile-panel-header'>
                                <div>
                                    <p className='booking-kicker'>Release</p>
                                    <h3>Cities</h3>
                                </div>
                            </div>
                            <MultiChoiceList
                                options={cities}
                                selected={values.cities}
                                onToggle={(city) => toggleChoice(values.cities, city, nextValue => setFieldValue("cities", nextValue))}
                            />
                            <div className='form-floating'>
                                <KaanKaplanTextInput name='cityName' type='text' className='form-control' id='cityName' placeholder='Other Cities' />
                                <label htmlFor='cityName'>Other Cities</label>
                            </div>
                            <p className='profile-muted text-start'>Each selected city gets default CineSaga screens and showtimes. You can edit theatres later in Manage Theatres.</p>
                        </section>

                        <div className='movie-setup-actions'>
                            <button type='button' className='btn btn-outline-dark' onClick={() => navigate('/addMovie')}>Back to Movies</button>
                            <button type='submit' className='btn btn-primary'>Save Setup</button>
                        </div>
                    </Form>}
                </Formik>
            </div>
            <ToastContainer />
        </div>
    )
}

function asArray(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean)
    }
    return value ? [value] : []
}

function splitNames(value) {
    return value ? value.split(",").map(name => name.trim()).filter(Boolean) : []
}

function uniqueNames(values) {
    return [...new Set(values.filter(Boolean).map(value => value.trim()).filter(Boolean))]
}

function handlePosterFile(event, setFieldValue) {
    const file = event.target.files?.[0]
    if (!file) {
        return
    }

    const reader = new FileReader()
    reader.onload = () => setFieldValue("imageUrl", reader.result || "")
    reader.readAsDataURL(file)
}

function MultiChoiceList({ options, selected, onToggle }) {
    const selectedValues = asArray(selected)
    return (
        <div className='setup-choice-list'>
            {options.map(option => {
                const isSelected = selectedValues.includes(option)
                return (
                    <button type='button' key={option}
                        className={`setup-choice-chip ${isSelected ? "active" : ""}`}
                        onClick={() => onToggle(option)}>
                        <span>{option}</span>
                        <i className={`fa-solid ${isSelected ? "fa-check" : "fa-plus"}`}></i>
                    </button>
                )
            })}
        </div>
    )
}

function toggleChoice(currentValues, value, setNextValue) {
    const values = asArray(currentValues)
    const nextValues = values.includes(value)
        ? values.filter(item => item !== value)
        : [...values, value]
    setNextValue(nextValues)
}
