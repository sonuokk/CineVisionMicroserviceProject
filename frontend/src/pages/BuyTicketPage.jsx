import Cleave from 'cleave.js/react'
import { Form, Formik } from 'formik'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import { PaymentService } from '../services/paymentService'
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput'

export default function BuyTicketPage() {

    const navigate = useNavigate()

    const paymentService = useMemo(() => new PaymentService(), []);

    const [ticketItem, setTicketItem] = useState("ticketSection")
    const [adultTicketNumber, setAdultTicketNumber] = useState(0)
    const [studentTicketNumber, setStudentTicketNumber] = useState(0)
    const [chairNumber, setChairNumber] = useState(studentTicketNumber + adultTicketNumber)
    const [chairNumberList, setChairNumberList] = useState([])
    const [bookedSeats, setBookedSeats] = useState([])

    const movieState = useSelector(state => state.movie.payload)

    useEffect(() => {
        if (!movieState?.movieName) {
            toast.warning("Choose a movie and showtime before booking tickets.", {
                theme: "dark",
                position: "top-center"
            });
            navigate("/");
            return;
        }

        paymentService.getBookedSeats({
            movieName: movieState?.movieName,
            saloonName: movieState?.saloonName,
            movieDay: movieState?.movieDay,
            movieStartTime: movieState?.movieTime
        }).then(result => {
            setBookedSeats(result.data || []);
        }).catch(() => setBookedSeats([]));
    }, [movieState, navigate, paymentService])

    useEffect(() => {
        bookedSeats.forEach(seatId => {
            let chair = document.getElementById(seatId);
            if (chair) {
                chair.style.background = "#6c757d";
                chair.style.color = "#fff";
                chair.className = "booked";
                chair.title = "Already booked";
            }
        });
    }, [bookedSeats, ticketItem])

    function checkChairIsEmpty(elementId) {
        if (bookedSeats.includes(elementId)) {
            return false;
        }
        let classname = document.getElementById(elementId).className;
        if(classname === "taken" || classname === "booked"){
            return false;
        }
        return true;
    }

    function selectChair(elementId) {
        let item = document.getElementById(elementId);
        if (bookedSeats.includes(elementId) || item.className === "booked") {
            toast.warning("That seat is already booked. Please choose another one.", {
                theme: "dark",
                position: "top-center"
            });
            return;
        }
        if(checkChairIsEmpty(elementId) && chairNumber > 0) {
            item.style.background = "#ff6a00";
            item.className = "taken";
            setChairNumberList([...chairNumberList, elementId]);
            setChairNumber(chairNumber-1)
        } else {
            if(item.className === "taken"){
                item.removeAttribute("style");
                item.className= "empty";
                let list = chairNumberList.filter(item => item !== elementId);
                setChairNumberList(list);
                setChairNumber(chairNumber+1)
            }
        }
    }

    // function markChairsWithChairId(chairIdList) {
    //     for(let i=0; i < chairIdList.length; i++) {
    //         let chair = document.getElementById("E4");
    //         console.log(chair)
    //         chair.style.background = "#ff6a00";
    //         chair.className = "taken";
    //     }
    // }

  return (
    <div className='ticket-page'>

        <div className='row justify-content-center align-items-start'>

            <div className='ticket-page-bg-img  col-sm-12 col-md-4 text-light'>
                <div className='mt-5 pt-5'>
                    <h3 className='mt-2'> {movieState?.movieName} </h3>
                    <img className='img-thumbnail w-50 mx-auto mt-5' src={movieState?.imageUrl} alt={movieState?.movieName || "Movie poster"} />
                    <h5 className='pt-5'><i className="fa-solid fa-location-dot"></i>{movieState?.saloonName}</h5>
                    <h5 className='py-2'><i className="fa-solid fa-calendar-days"></i>{movieState?.movieDay}</h5>
                    <h5><i className="fa-regular fa-clock"></i>{movieState?.movieTime}</h5>
                </div>
               
            </div>
            {/* for css ::after property */}
            <style dangerouslySetInnerHTML={{
                    __html: [
                        '.ticket-page-bg-img:after {',
                        '  content: " ";',
                        '  position: absolute;',                
                        'z-index: -1;',
                        'inset: 0;',
                        `background-image: url(${movieState?.imageUrl});`, 
                        'background-repeat: no-repeat;',
                        'background-size: cover;',
                        'background-position: top center;',
                        'opacity: 0.8;',
                        'min-height: 100vh;',
                        '-webkit-filter: blur(8px) saturate(1);',
                        '}'
                        ].join('\n')
                }}>
                </style>
            <div className='col-sm-12 col-md-8 pt-5'>
                <div className='container pt-5'>
                    
                    <div className="accordion accordion-flush" id="accordionPanelsStayOpenExample">
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="panelsStayOpen-headingTwo">
                                <div className='row pt-3 pb-1 px-4 align-items-center'>
                                        <div className='col-sm-6 text-start'>
                                            <h3>Choose Tickets</h3>
                                        </div>
                                            {/* Ticket Type Section */}
                                         
                                            <div className='col-sm-6 mb-2 text-end'>
                                                {ticketItem === "ticketSection" ?
                                                    <button className='btn btn-dark'
                                                        data-bs-toggle="collapse" 
                                                        data-bs-target="#panelsStayOpen-collapseTwo" aria-expanded="true" aria-controls="panelsStayOpen-collapseTwo"
                                                        onClick={() => {
                                                            if(studentTicketNumber === 0 && adultTicketNumber === 0) {
                                                                toast.warning("Please choose at least one ticket to continue.", {
                                                                    theme: "dark",
                                                                    position: "top-center"
                                                                })
                                                            } else {
                                                                setTicketItem("placeSection")
                                                                setChairNumber(studentTicketNumber + adultTicketNumber)
                                                            }
                                                        }}>Continue</button>
                                                :  
                                                    <button className='btn btn-outline-dark'
                                                        data-bs-toggle="collapse" 
                                                        data-bs-target="#panelsStayOpen-collapseOne" aria-expanded="true" aria-controls="panelsStayOpen-collapseOne"
                                                        onClick={() => setTicketItem("ticketSection")}>Change</button>}
                                            </div>
                                        
                                </div>
                            </h2>

                            {ticketItem === 'ticketSection' ? (
                                <div id="panelsStayOpen-collapseOne" className="accordion-collapse collapse show" aria-labelledby="panelsStayOpen-headingOne">
                                    <div className="accordion-body">
                                        <section>
                                                <div className='row '>
                                                    <div className='col-sm-6 text-start'>
                                                        <p>After choosing your movie and showtime, select your ticket type.
                                                            Student ticket holders should bring a valid student ID.</p>                        
                                                    </div>
                                                </div>

                                            <div className='row mt-3 px-2 border border-2 align-items-center'>
                                                <div className='col-sm-6 text-uppercase border-end'>
                                                    Adult
                                                </div>
                                                <div className='col-sm-3 border-end'>
                                                    Price $25
                                                </div>
                                                <div className='col-sm-3'>
                                                    <div className='row justify-content-center align-items-center'>
                                                        <div className='col-sm-4'>
                                                            <button className='btn btn-dark'
                                                                onClick={() => {
                                                                    if(adultTicketNumber > 0){
                                                                        setAdultTicketNumber(adultTicketNumber-1)}
                                                                    }
                                                                    }>
                                                                        <i className="fa-solid fa-minus"></i></button>
                                                        </div>
                                                        <div className='col-sm-4'>
                                                            {adultTicketNumber}
                                                        </div>
                                                        <div className='col-sm-4 py-2'>
                                                            <button className='btn btn-dark'
                                                                onClick={() => setAdultTicketNumber(adultTicketNumber+1)}> <i className="fa-solid fa-plus"></i> </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='row mt-1 px-2 border border-2 align-items-center'>
                                                <div className='col-sm-6 text-uppercase border-end'>
                                                    Student
                                                </div>
                                                <div className='col-sm-3 border-end'>
                                                    Price $15
                                                </div>
                                                <div className='col-sm-3'>
                                                    <div className='row justify-content-center align-items-center'>
                                                        <div className='col-sm-4'>
                                                            <button className='btn btn-dark'
                                                             onClick={() => {
                                                                if(studentTicketNumber > 0){
                                                                    setStudentTicketNumber(studentTicketNumber-1)}
                                                                }
                                                                }>
                                                                    <i className="fa-solid fa-minus"></i></button>
                                                               
                                                        </div>
                                                        <div className='col-sm-4'>
                                                            {studentTicketNumber}
                                                        </div>
                                                        <div className='col-sm-4 py-2'>
                                                            <button className='btn btn-dark'
                                                                onClick={() => setStudentTicketNumber(studentTicketNumber+1)}> <i className="fa-solid fa-plus"></i> </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className='lead text-end mt-3 me-5'>Total: <strong>${(studentTicketNumber * 15.00 + adultTicketNumber * 25.00).toFixed(2)} </strong></p>
                                        </section>

                                    </div>
                                </div>
                            ): null}
                        </div>
                        
                        {/* Place Section */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="panelsStayOpen-headingTwo">
                                <div className='row pt-3 pb-1 px-4 align-items-center'>
                                        <div className='col-sm-6 text-start'>
                                            <h3>Choose Seats </h3>
                                        </div>
                                        <div className='col-sm-6 mb-2 text-end'>
                                            {ticketItem === "placeSection" ?
                                                <button className='btn btn-dark' data-bs-toggle="collapse" 
                                                    data-bs-target="#panelsStayOpen-collapseThree"
                                                    aria-expanded="false" aria-controls="panelsStayOpen-collapseThree"
                                                    onClick={() => {
                                                        if (chairNumber !== 0) {
                                                            toast.warning("Please choose seats for every ticket.", {
                                                                theme: "dark",
                                                                position: "top-center"
                                                            })
                                                        } else {
                                                            setTicketItem("paySection")
                                                        }
                                                    }}>Continue</button>
                                            :
                                                <button className='btn btn-outline-dark' data-bs-toggle="collapse" 
                                                    data-bs-target="#panelsStayOpen-collapseTwo"
                                                    aria-expanded="false" aria-controls="panelsStayOpen-collapseTwo"
                                                    onClick={() => {
                                                        setTicketItem("placeSection")
                                                        // markChairsWithChairId(chairNumberList)
                                                    }}>
                                                        Change
                                                </button>
                                            }
                                        </div>
                                </div>
                            </h2>

                                <div id="panelsStayOpen-collapseTwo" className="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingTwo">
                                    <div className="accordion-body">
                                    {ticketItem === "placeSection" ? 
                                        <table className="table">
                                            <tbody>
                                                <tr>
                                                    <th scope="row">F</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td id="F1" onClick={() => selectChair("F1")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="F2" onClick={() => selectChair("F2")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="F3" onClick={() => selectChair("F3")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="F4" onClick={() => selectChair("F4")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="F5" onClick={() => selectChair("F5")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="F6" onClick={() => selectChair("F6")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="F7" onClick={() => selectChair("F7")}> <i className="fa-solid fa-chair"></i> </td>
                                                </tr>
                                                <tr>
                                                <th >E</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td id="E1" onClick={() => selectChair("E1")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="E2" onClick={() => selectChair("E2")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="E3" onClick={() => selectChair("E3")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="E4" onClick={() => selectChair("E4")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="E5" onClick={() => selectChair("E5")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="E6" onClick={() => selectChair("E6")}> <i className="fa-solid fa-chair"></i> </td>
                                                </tr>
                                                <tr>
                                                    <th>D</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td id="D1" onClick={() => selectChair("D1")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="D2" onClick={() => selectChair("D2")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="D3" onClick={() => selectChair("D3")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="D4" onClick={() => selectChair("D4")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="D5" onClick={() => selectChair("D5")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="D6" onClick={() => selectChair("D6")}> <i className="fa-solid fa-chair"></i> </td>
                                                </tr>
                                                <tr>
                                                    <th>C</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td id="C1" onClick={() => selectChair("C1")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="C2" onClick={() => selectChair("C2")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="C3" onClick={() => selectChair("C3")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="C4" onClick={() => selectChair("C4")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="C5" onClick={() => selectChair("C5")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="C6" onClick={() => selectChair("C6")}> <i className="fa-solid fa-chair"></i> </td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">B</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td id="B1" onClick={() => selectChair("B1")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="B2" onClick={() => selectChair("B2")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="B3" onClick={() => selectChair("B3")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="B4" onClick={() => selectChair("B4")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="B5" onClick={() => selectChair("B5")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="B6" onClick={() => selectChair("B6")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="B7" onClick={() => selectChair("B7")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="B8" onClick={() => selectChair("B8")}> <i className="fa-solid fa-chair"></i> </td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">A</th>
                                                    <td></td>
                                                    <td></td>
                                                    <td id="A1" onClick={() => selectChair("A1")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="A2" onClick={() => selectChair("A2")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="A3" onClick={() => selectChair("A3")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="A4" onClick={() => selectChair("A4")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="A5" onClick={() => selectChair("A5")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="A6" onClick={() => selectChair("A6")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="A7" onClick={() => selectChair("A7")}> <i className="fa-solid fa-chair"></i> </td>
                                                    <td id="A8" onClick={() => selectChair("A8")}> <i className="fa-solid fa-chair"></i> </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                            : null}
                                            {ticketItem === "placeSection" ? (
                                                <div>
                                                    <p className='pt-2'>Screen</p>
                                                    <hr style={{height:"4px", color:"black"}}/>
                                                </div>
                                            )
                                            : null}
                                    </div>
                                </div>
                                
                                </div>

                        {/* Pay Section */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="panelsStayOpen-headingThree">
                                <div className='row pt-3 pb-1 px-4 align-items-center'>
                                        <div className='col-sm-6 text-start'>
                                            <h3>Payment</h3>
                                        </div>
                                        <div className='col-sm-6 mb-2 text-end'>
                                            {ticketItem === "paySection" ?
                                                <h3>Total: ${(studentTicketNumber * 15.00 + adultTicketNumber * 25.00).toFixed(2)}</h3>
                                            : null}
                                        </div>
                                      
                                </div>
                            </h2>
                            
                            <div id="panelsStayOpen-collapseThree" className="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingThree">
                            {ticketItem === "paySection" ? 
                            <div className="accordion-body">
                                <Formik
                                    initialValues={{}}
                                    onSubmit={(values) => {
                                        let  result = chairNumberList.join(" ");

                                        values.chairNumbers = result;
                                        values.movieName = movieState?.movieName;
                                        values.saloonName= movieState?.saloonName;
                                        values.movieDay= movieState?.movieDay;
                                        values.movieStartTime= movieState?.movieTime;
                                        values.adultTicketCount = adultTicketNumber;
                                        values.studentTicketCount = studentTicketNumber;

                                        paymentService.sendTicketDetail(values).then(() => {
                                            navigate("/paymentSuccess")
                                        }).catch((e) => toast.error(e.response?.data?.message || "Could not complete booking. Please try again.", {
                                            theme: "dark",
                                            position: "top-center"
                                        }))
                                    }}>
                                    <Form className='row justify-content-center align-items-start'>
                                        <div className='col-sm-12 col-md-6'>
                                            <div className="imput-group form-floating has-validation mb-3">
                                                <KaanKaplanTextInput name="fullName" type="text" className="form-control" id="fullName" placeholder="Full Name" required/>
                                                <label htmlFor="fullName">Full Name</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="email" type="email" className="form-control" id="email" placeholder="Email" required/>
                                                <label htmlFor="email">Email</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <KaanKaplanTextInput name="phone" type="tel" className="form-control" id="phone" placeholder="Optional"/>
                                                <label htmlFor="phone">Indian Mobile Number Optional</label>
                                            </div>
                                            
                                           
                                        </div>

                                        <div className='col-sm-12 col-md-6 mb-3'>
                                            <div className="form-floating mb-3">
                                                <Cleave className="form-control" id="floatingCardNumber" placeholder='Credit Card Number' required
                                                options={{creditCard:true}} />
                                                <label htmlFor="floatingCardNumber">Credit Card Number</label>
                                            </div>
                                            <div className='row'>
                                                <div className='col-sm-6'>
                                                    <div className="form-floating mb-3">
                                                        <Cleave type="text" className="form-control" id="floatingCardLastDate" placeholder='Expiry Date' required
                                                        options={{date:true, datePattern: ['m','y']}} />
                                                        <label htmlFor="floatingCardLastDate">Expiry Date</label>
                                                    </div>
                                                </div>
                                                <div className='col-sm-6'>
                                                    <div className="form-floating mb-3">
                                                        <input type="text" className="form-control"  maxLength="3" size="3"  id="floatingSecurityNumber" placeholder="Security Code" required/>
                                                        <label htmlFor="floatingSecurityNumber">CCV</label>
                                                    </div>
                                                </div>
                                                <p className='text-start'> <input className="form-check-input me-3" type="checkbox" value="" aria-label="Checkbox for following text input" required/>I have read and accept the pre-information terms and
                                                the distance sales agreement.
                                            </p>
                                            </div>
                                        </div>

                                        <hr />
                                        <div className='text-end mt-1'>
                                            <button type='submit' className='btn btn-dark col-3'>Pay</button>
                                        </div>
                                    </Form>
                                </Formik>
                            </div>
                            : null}
                            </div>
                        </div>
                    </div>



                </div>
            </div>


        </div>
     
        <ToastContainer />
    </div>
  )
}

