const dbName = "cinesaga";
const target = db.getSiblingDB(dbName);

for (const legacyName of ["claim", "user", "user_otp_verifications", "movieSnapshots", "bookingSnapshots"]) {
  target.getCollection(legacyName).drop();
}

const now = new Date();

const users = [
  ["aarav.mehra@example.com", "Aarav Mehra", "Mumbai"],
  ["riya.sen@example.com", "Riya Sen", "Delhi"],
  ["kabir.roy@example.com", "Kabir Roy", "Bengaluru"],
  ["naina.shah@example.com", "Naina Shah", "Pune"],
  ["dev.patel@example.com", "Dev Patel", "Hyderabad"]
].map(([email, fullName, preferredCity], index) => ({
  email,
  password: "$2a$10$dummyVerifiedPasswordHashForDemoOnly",
  fullName,
  phone: `+91980000000${index}`,
  preferredCity,
  savedPaymentCards: [],
  bookedMovies: [],
  favoriteMovies: [],
  favoriteTheaters: [],
  walletBalance: NumberDecimal("1500.00"),
  walletTransactions: [],
  notificationPreferences: {
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true
  },
  emailVerified: true,
  claim: {
    claimName: "CUSTOMER"
  },
  registrationOtpAttempts: 0
}));

for (const user of users) {
  target.users.updateOne({ email: user.email }, { $set: user }, { upsert: true });
}

const movies = [
  {
    _id: 1,
    movieId: 1,
    movieName: "Interstellar",
    description: "A space epic about survival, time, and love.",
    duration: 169,
    releaseDate: new Date("2014-11-07"),
    isDisplay: true,
    movieTrailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E",
    category: { categoryId: 3, categoryName: "Sci-Fi" },
    director: { directorId: 1, directorName: "Christopher Nolan" },
    image: { imageId: 1, imageUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" }
  },
  {
    _id: 2,
    movieId: 2,
    movieName: "Barbie",
    description: "A bright, funny trip from Barbieland to the real world.",
    duration: 114,
    releaseDate: new Date("2023-07-21"),
    isDisplay: true,
    movieTrailerUrl: "https://www.youtube.com/embed/pBk4NYhWNMM",
    category: { categoryId: 2, categoryName: "Drama" },
    director: { directorId: 2, directorName: "Greta Gerwig" },
    image: { imageId: 2, imageUrl: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg" }
  },
  {
    _id: 3,
    movieId: 3,
    movieName: "Dune: Part Two",
    description: "Paul Atreides joins the Fremen and faces his destiny.",
    duration: 166,
    releaseDate: new Date("2024-03-01"),
    isDisplay: true,
    movieTrailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    category: { categoryId: 3, categoryName: "Sci-Fi" },
    director: { directorId: 3, directorName: "Denis Villeneuve" },
    image: { imageId: 3, imageUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" }
  },
  {
    _id: 4,
    movieId: 4,
    movieName: "Avatar: Fire and Ash",
    description: "The next Pandora chapter prepared for the big screen.",
    duration: 180,
    releaseDate: new Date("2026-12-18"),
    isDisplay: false,
    movieTrailerUrl: "",
    category: { categoryId: 3, categoryName: "Sci-Fi" },
    director: { directorId: 4, directorName: "James Cameron" },
    image: { imageId: 4, imageUrl: "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg" }
  },
  {
    _id: 5,
    movieId: 5,
    movieName: "The Batman Part II",
    description: "Gotham waits for its next dark detective story.",
    duration: 165,
    releaseDate: new Date("2027-10-01"),
    isDisplay: false,
    movieTrailerUrl: "",
    category: { categoryId: 1, categoryName: "Action" },
    director: { directorId: 5, directorName: "Matt Reeves" },
    image: { imageId: 5, imageUrl: "https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg" }
  },
  {
    _id: 6,
    movieId: 6,
    movieName: "Spider-Man: Beyond the Spider-Verse",
    description: "Miles Morales returns for another animated multiverse event.",
    duration: 140,
    releaseDate: new Date("2027-06-04"),
    isDisplay: false,
    movieTrailerUrl: "",
    category: { categoryId: 1, categoryName: "Action" },
    director: { directorId: 6, directorName: "Joaquim Dos Santos" },
    image: { imageId: 6, imageUrl: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg" }
  }
];

for (const movie of movies) {
  target.movies.updateOne({ movieId: movie.movieId }, { $set: movie }, { upsert: true });
}

const theatres = [
  { _id: 1, saloonId: 1, saloonName: "CineSaga Bandra Luxe", city: { cityId: 1, cityName: "Mumbai" } },
  { _id: 2, saloonId: 2, saloonName: "CineSaga Saket Select", city: { cityId: 2, cityName: "Delhi" } },
  { _id: 3, saloonId: 3, saloonName: "CineSaga Orion Mall", city: { cityId: 3, cityName: "Bengaluru" } }
];

for (const theatre of theatres) {
  target.theatres.updateOne({ saloonId: theatre.saloonId }, { $set: theatre }, { upsert: true });
}

const showtimes = [
  { _id: 1, id: 1, movieBeginTime: "10:30", movie: movies[0], saloon: theatres[0] },
  { _id: 2, id: 2, movieBeginTime: "20:15", movie: movies[0], saloon: theatres[0] },
  { _id: 3, id: 3, movieBeginTime: "13:45", movie: movies[1], saloon: theatres[1] },
  { _id: 4, id: 4, movieBeginTime: "22:40", movie: movies[1], saloon: theatres[1] },
  { _id: 5, id: 5, movieBeginTime: "17:00", movie: movies[2], saloon: theatres[2] },
  { _id: 6, id: 6, movieBeginTime: "20:15", movie: movies[2], saloon: theatres[2] }
];

for (const showtime of showtimes) {
  target.showtimes.updateOne({ id: showtime.id }, { $set: showtime }, { upsert: true });
}

const bookings = [
  {
    _id: "CV-DEMO100",
    bookingCode: "CV-DEMO100",
    movieName: "Interstellar",
    saloonName: "CineSaga Bandra Luxe",
    theatreName: "CineSaga Bandra Luxe",
    movieDay: "2026-05-10",
    movieStartTime: "20:15",
    showtimeStartTime: "20:15",
    email: "aarav.mehra@example.com",
    fullName: "Aarav Mehra",
    phone: "+919999999999",
    adultTicketCount: 2,
    studentTicketCount: 0,
    totalAmount: NumberDecimal("50.00"),
    status: "CONFIRMED",
    createdAt: now,
    seats: [
      { id: "CV-DEMO100-A1", seatNumber: "A1", bookingCode: "CV-DEMO100" },
      { id: "CV-DEMO100-A2", seatNumber: "A2", bookingCode: "CV-DEMO100" }
    ],
    qrCodePayload: "CINESAGA|booking=CV-DEMO100|movie=Interstellar|show=2026-05-10 20:15|seats=A1,A2"
  },
  {
    _id: "CV-DEMO200",
    bookingCode: "CV-DEMO200",
    movieName: "Dune: Part Two",
    saloonName: "CineSaga Orion Mall",
    theatreName: "CineSaga Orion Mall",
    movieDay: "2026-05-11",
    movieStartTime: "17:00",
    showtimeStartTime: "17:00",
    email: "riya.sen@example.com",
    fullName: "Riya Sen",
    phone: "+919999999998",
    adultTicketCount: 2,
    studentTicketCount: 0,
    totalAmount: NumberDecimal("50.00"),
    status: "CONFIRMED",
    createdAt: now,
    seats: [
      { id: "CV-DEMO200-C3", seatNumber: "C3", bookingCode: "CV-DEMO200" },
      { id: "CV-DEMO200-C4", seatNumber: "C4", bookingCode: "CV-DEMO200" }
    ],
    qrCodePayload: "CINESAGA|booking=CV-DEMO200|movie=Dune: Part Two|show=2026-05-11 17:00|seats=C3,C4"
  }
];

for (const booking of bookings) {
  target.bookings.updateOne({ bookingCode: booking.bookingCode }, { $set: booking }, { upsert: true });
}

const payments = [
  {
    _id: "PAY-CV-DEMO100",
    paymentCode: "PAY-CV-DEMO100",
    booking: bookings[0],
    amount: NumberDecimal("50.00"),
    paymentMode: "CARD",
    status: "PAID",
    cardHolderName: "Aarav Mehra",
    maskedCardNumber: "**** **** **** 4242",
    cardNumberHash: "dummy-hash-PAY-CV-DEMO100",
    cardExpiry: "12/30",
    cardBrand: "Visa",
    createdAt: now
  },
  {
    _id: "PAY-CV-DEMO200",
    paymentCode: "PAY-CV-DEMO200",
    booking: bookings[1],
    amount: NumberDecimal("50.00"),
    paymentMode: "WALLET",
    status: "PAID",
    cardHolderName: "Riya Sen",
    maskedCardNumber: "WALLET",
    cardNumberHash: "dummy-hash-PAY-CV-DEMO200",
    cardExpiry: "N/A",
    cardBrand: "Wallet",
    createdAt: now
  }
];

for (const payment of payments) {
  target.payments.updateOne({ paymentCode: payment.paymentCode }, { $set: payment }, { upsert: true });
}

printjson(target.getCollectionNames().sort());
