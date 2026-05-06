INSERT INTO category (category_id, category_name)
SELECT 1, 'Action'
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_id = 1);

INSERT INTO category (category_id, category_name)
SELECT 2, 'Drama'
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_id = 2);

INSERT INTO category (category_id, category_name)
SELECT 3, 'Sci-Fi'
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_id = 3);

INSERT INTO category (category_id, category_name)
SELECT 4, 'Animation'
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_id = 4);

INSERT INTO director (director_id, director_name)
SELECT 1, 'Christopher Nolan'
WHERE NOT EXISTS (SELECT 1 FROM director WHERE director_id = 1);

INSERT INTO director (director_id, director_name)
SELECT 2, 'Greta Gerwig'
WHERE NOT EXISTS (SELECT 1 FROM director WHERE director_id = 2);

INSERT INTO movie (movie_id, movie_name, description, duration, release_date, is_display, movie_trailer_url, category_id, director_id)
SELECT 1, 'Interstellar', 'A team of explorers travels through a wormhole in space in an attempt to ensure humanity''s survival.', 169, DATE '2014-11-07', true, 'https://www.youtube.com/embed/zSWdZVtXT7E', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM movie WHERE movie_id = 1);

INSERT INTO movie (movie_id, movie_name, description, duration, release_date, is_display, movie_trailer_url, category_id, director_id)
SELECT 2, 'Barbie', 'Barbie and Ken leave Barbieland and discover the complicated beauty of the real world.', 114, DATE '2023-07-21', true, 'https://www.youtube.com/embed/pBk4NYhWNMM', 2, 2
WHERE NOT EXISTS (SELECT 1 FROM movie WHERE movie_id = 2);

INSERT INTO movie (movie_id, movie_name, description, duration, release_date, is_display, movie_trailer_url, category_id, director_id)
SELECT 3, 'Dune: Part Three', 'A coming-soon sci-fi epic placeholder for testing the Coming Soon tab.', 150, DATE '2027-12-17', false, 'https://www.youtube.com/embed/Way9Dexny3w', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM movie WHERE movie_id = 3);

INSERT INTO movie_image (image_id, image_url, movie_movie_id)
SELECT 1, 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 1
WHERE NOT EXISTS (SELECT 1 FROM movie_image WHERE image_id = 1);

INSERT INTO movie_image (image_id, image_url, movie_movie_id)
SELECT 2, 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 2
WHERE NOT EXISTS (SELECT 1 FROM movie_image WHERE image_id = 2);

INSERT INTO movie_image (image_id, image_url, movie_movie_id)
SELECT 3, 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', 3
WHERE NOT EXISTS (SELECT 1 FROM movie_image WHERE image_id = 3);

INSERT INTO city (city_id, city_name, movie_id)
SELECT 1, 'Mumbai', 1
WHERE NOT EXISTS (SELECT 1 FROM city WHERE city_id = 1);

INSERT INTO city (city_id, city_name, movie_id)
SELECT 2, 'Delhi', 1
WHERE NOT EXISTS (SELECT 1 FROM city WHERE city_id = 2);

INSERT INTO city (city_id, city_name, movie_id)
SELECT 3, 'Bengaluru', 2
WHERE NOT EXISTS (SELECT 1 FROM city WHERE city_id = 3);

INSERT INTO saloon (saloon_id, saloon_name, city_id)
SELECT 1, 'Mumbai CineSaga Screen 1', 1
WHERE NOT EXISTS (SELECT 1 FROM saloon WHERE saloon_id = 1);

INSERT INTO saloon (saloon_id, saloon_name, city_id)
SELECT 2, 'Delhi CineSaga Screen 1', 2
WHERE NOT EXISTS (SELECT 1 FROM saloon WHERE saloon_id = 2);

INSERT INTO saloon (saloon_id, saloon_name, city_id)
SELECT 3, 'Bengaluru CineSaga Screen 1', 3
WHERE NOT EXISTS (SELECT 1 FROM saloon WHERE saloon_id = 3);

INSERT INTO movie_saloon_time (id, movie_begin_time, movie_id, saloon_id)
SELECT 1, '10:30', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM movie_saloon_time WHERE id = 1);

INSERT INTO movie_saloon_time (id, movie_begin_time, movie_id, saloon_id)
SELECT 2, '13:45', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM movie_saloon_time WHERE id = 2);

INSERT INTO movie_saloon_time (id, movie_begin_time, movie_id, saloon_id)
SELECT 3, '19:30', 1, 2
WHERE NOT EXISTS (SELECT 1 FROM movie_saloon_time WHERE id = 3);

INSERT INTO movie_saloon_time (id, movie_begin_time, movie_id, saloon_id)
SELECT 4, '18:00', 2, 3
WHERE NOT EXISTS (SELECT 1 FROM movie_saloon_time WHERE id = 4);

SELECT setval(pg_get_serial_sequence('category', 'category_id'), (SELECT COALESCE(MAX(category_id), 1) FROM category));
SELECT setval(pg_get_serial_sequence('director', 'director_id'), (SELECT COALESCE(MAX(director_id), 1) FROM director));
SELECT setval(pg_get_serial_sequence('movie', 'movie_id'), (SELECT COALESCE(MAX(movie_id), 1) FROM movie));
SELECT setval(pg_get_serial_sequence('movie_image', 'image_id'), (SELECT COALESCE(MAX(image_id), 1) FROM movie_image));
SELECT setval(pg_get_serial_sequence('city', 'city_id'), (SELECT COALESCE(MAX(city_id), 1) FROM city));
SELECT setval(pg_get_serial_sequence('saloon', 'saloon_id'), (SELECT COALESCE(MAX(saloon_id), 1) FROM saloon));
SELECT setval(pg_get_serial_sequence('movie_saloon_time', 'id'), (SELECT COALESCE(MAX(id), 1) FROM movie_saloon_time));
