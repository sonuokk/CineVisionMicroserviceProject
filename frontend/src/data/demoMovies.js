export const demoMovies = {
    now: [
        {
            movieId: 1,
            movieName: "Interstellar",
            description: "A space epic about survival, time, and love.",
            duration: 169,
            releaseDate: "2014-11-07T00:00:00.000Z",
            isDisplay: true,
            categoryName: "Sci-Fi",
            directorName: "Christopher Nolan",
            movieImageUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            movieTrailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E"
        },
        {
            movieId: 2,
            movieName: "Barbie",
            description: "A bright, funny trip from Barbieland to the real world.",
            duration: 114,
            releaseDate: "2023-07-21T00:00:00.000Z",
            isDisplay: true,
            categoryName: "Comedy",
            directorName: "Greta Gerwig",
            movieImageUrl: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
            movieTrailerUrl: "https://www.youtube.com/embed/pBk4NYhWNMM"
        },
        {
            movieId: 3,
            movieName: "Dune: Part Two",
            description: "Paul Atreides joins the Fremen and faces his destiny.",
            duration: 166,
            releaseDate: "2024-03-01T00:00:00.000Z",
            isDisplay: true,
            categoryName: "Sci-Fi",
            directorName: "Denis Villeneuve",
            movieImageUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
            movieTrailerUrl: "https://www.youtube.com/embed/Way9Dexny3w"
        }
    ],
    soon: [
        {
            movieId: 4,
            movieName: "Avatar: Fire and Ash",
            description: "The next Pandora chapter prepared for the big screen.",
            duration: 180,
            releaseDate: "2026-12-18T00:00:00.000Z",
            isDisplay: false,
            categoryName: "Sci-Fi",
            directorName: "James Cameron",
            movieImageUrl: "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
            movieTrailerUrl: ""
        },
        {
            movieId: 5,
            movieName: "The Batman Part II",
            description: "Gotham waits for its next dark detective story.",
            duration: 165,
            releaseDate: "2027-10-01T00:00:00.000Z",
            isDisplay: false,
            categoryName: "Action",
            directorName: "Matt Reeves",
            movieImageUrl: "https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
            movieTrailerUrl: ""
        },
        {
            movieId: 6,
            movieName: "Spider-Man: Beyond the Spider-Verse",
            description: "Miles Morales returns for another animated multiverse event.",
            duration: 140,
            releaseDate: "2027-06-04T00:00:00.000Z",
            isDisplay: false,
            categoryName: "Animation",
            directorName: "Joaquim Dos Santos",
            movieImageUrl: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
            movieTrailerUrl: ""
        }
    ]
}

export const allDemoMovies = [...demoMovies.now, ...demoMovies.soon]

export function getDemoMovieById(movieId) {
    return allDemoMovies.find(movie => String(movie.movieId) === String(movieId))
}
