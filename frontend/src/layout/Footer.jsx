import React from 'react'

export default function Footer() {
  return (
    <div>

        <footer className="py-5 bg-black">
            <div className="container px-5">
              <div className='row justify-content-evenly align-items-center'>
                <div className='col'>
                  <p className='m-1 lead text-center text-white'>Now Showing</p>
                  <p className='m-1 lead text-center text-white'>Coming Soon</p>
                  <p className='m-1 lead text-center text-white'>Cinemas</p>
                </div>
                <div className='col'>
                  <p className='m-1 lead text-center text-white'>E-Ticket</p>
                  <p className='m-1 lead text-center text-white'>Refunds</p>
                  <p className='m-1 lead text-center text-white'>Terms of Sale</p>
                </div>
              </div>
              <p className="mt-5 text-center text-white small">
                <strong>
                   Copyright &copy; CineSaga 2022
                </strong> 
              </p>
            </div>
        </footer>

    </div>
  )
}

