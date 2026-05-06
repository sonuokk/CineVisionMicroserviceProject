import { Form, Formik } from 'formik';
import React, { useState } from 'react'
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActorService } from '../../services/actorService';
import { CityService } from '../../services/cityService';
import KaanKaplanSelect from '../../utils/customFormItems/KaanKaplanSelect'
import KaanKaplanTextInput from '../../utils/customFormItems/KaanKaplanTextInput'
import * as yup from "yup";
import { MovieImageService } from '../../services/movieImageService';
import { useSelector } from 'react-redux';

export default function AddActorsAndCityToMovie() {

    let {movieId} = useParams();
    const navigate = useNavigate()

    const userFromRedux = useSelector(state => state.user.payload)

    const cityService = new CityService();
    const actorService = new ActorService();
    const movieImageService = new MovieImageService();

    const [cities, setCities] = useState([])
    const [actors, setActors] = useState([])

    useEffect(() => {
        cityService.getall().then(result => {
            let arr = [];
            result.data.forEach(element => {
                if(!arr.includes(element?.cityName)){
                    arr.push(element?.cityName)
                }
            });
            setCities(arr)
        })
        actorService.getall().then(result => {
            let arr = [];
            result.data.forEach(element => {
                if(!arr.includes(element?.actorName)){
                    arr.push(element?.actorName)
                }
            });
            setActors(arr)
        })
      }, [])

    const initValues = {
     
    }

    const validationSchema = yup.object({

   
    })

  return (
    <div>
        <div className='mt-5 p-5 container' style={{height: "100vh"}}>
            <h2 className='mt-4'>Add Movie</h2>
            <hr />

            <h5 className='my-4'>
                Add cast and city information for the movie you just created.
            </h5>

            <Formik 
                initialValues={initValues}
                validationSchema={validationSchema}
                onSubmit={async (values) => {
                    let actorNameList;
                    const typedActors = values.actorName
                        ? values.actorName.split(",").map(actor => actor.trim()).filter(Boolean)
                        : [];
                    const selectedActors = Array.isArray(values.actors)
                        ? values.actors
                        : values.actors ? [values.actors] : [];
                    const selectedCities = Array.isArray(values.cities)
                        ? values.cities
                        : values.cities ? [values.cities] : [];

                    actorNameList = [...selectedActors, ...typedActors];
                    if (actorNameList.length === 0 || selectedCities.length === 0 || !values.imageUrl) {
                        alert("Please add at least one actor, one city, and a poster image URL.");
                        return;
                    }

                    let actorDto = {
                        movieId: movieId,
                        actorNameList: actorNameList,
                        token: userFromRedux.token
                    }
                    let cityDto = {
                        movieId: movieId,
                        cityNameList: selectedCities,
                        token: userFromRedux.token
                    }
                    let movieImageDto = {
                        movieId: movieId,
                        imageUrl: values.imageUrl,
                        token: userFromRedux.token
                    }

                    try {
                        await actorService.addActor(actorDto);
                        await movieImageService.addMovieImage(movieImageDto);
                        await cityService.addCity(cityDto);
                        navigate("/addMovie");
                    } catch (error) {
                        alert(error.response?.data?.message || "Could not finish movie setup. Please check the form and try again.");
                    }
                }}>

                <Form>
                    <div class="mb-3">
                        <KaanKaplanSelect
                            class="form-select form-select-lg mb-3"
                            name="actors"
                            multiple
                            size={3}
                            options={actors.map(actor => (
                                {key: actor, text:actor, value: actor}
                            ))}
                        />
                    </div>
                    <p>If not listed, enter names separated by commas.</p>
                    <div class="form-floating mb-3">
                        <KaanKaplanTextInput  type="text" name='actorName' class="form-control" id="floatingInput" placeholder="Actor Name" />
                        <label for="floatingInput">Actor Name</label>
                    </div>

                    <div class="form-floating mb-3">
                        <KaanKaplanTextInput name='imageUrl' type="text" class="form-control" id="imageUrl" placeholder="Poster Image URL" />
                        <label for="imageUrl">Poster Image URL</label>
                    </div>

                     <div class="mb-3">
                        <KaanKaplanSelect 
                            class="form-select form-select-lg mb-3"
                            name="cities"
                            multiple
                            size={3}
                            options= {cities.map(city => (
                                {key: city, text:city, value: city}
                            ))}
                            placeholder="City"
                        />
                    </div>

                    <div className="d-grid gap-2 my-4 col-6 mx-auto">
                      <input
                        type="submit"
                        value="Add"
                        className="btn btn-block btn-primary"
                      />
                    </div>
                </Form>
            </Formik>
        </div>
    </div>
  )
}

