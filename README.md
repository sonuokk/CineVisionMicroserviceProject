# Full Stack Web Project with Microservices
This project is a full-stack web application project
and it was created with Java and React. 
Spring Cloud was used in this project to create
the microservice architecture. Detailed explanations
of the services in the microservice architecture 
are explained in the readme files of the services.

## Subject Of Project
CineSaga App is online cinema ticket sale website. Purpose of 
this website is to provide ease of buying tickets for those who 
want to watch movies in the cinema. People can display movies in the theaters or
upcoming movies. They can view the movie details and can learn the plot of the movie, 
actors of the movie, release date and so on. In this detail page, people can choose the city
and movie theater where they want to watch to movie. After this selection, they can automatically
redirect to payment page. In this payment page, they can choose ticket count and type such as 
student and adult. Then, they can choose the chairs they will sit on in the movie theater.
Finally, they complete the payment process after entering information
such as credit card information, email, name and surname.
If the payment is successful, the ticket details are sent to the email which entered by the user.
If people want to share their opinions about the movie, they can write comments on the movie detail page.
However, People must create an account to comments on movies. Only admins
can add movie,actor or director to the system. This authorization process is controlled
with Jwt token.

## Technologies Of Project
There are many technologies in this project. These are:
<h5> Backend Techologies </h5>
<ul>
    <li>Java 21 LTS</li>
    <li>Apache Maven 3.9.x</li>
    <li>Spring Boot 4.0.2 </li>
    <li>Spring Cloud 2025.1.1</li>
    <li>Spring Data Jpa</li>
    <li>Spring Security</li>
    <li>Lombok</li>
    <li>WebClient</li>
    <li>Apache Kafka</li>
    <li>Jwt</li>
    <li>Java Mail Sender</li>
    <li>Micrometer Tracing</li>
    <li>Zipkin</li>
    <li>Resilience4j</li>
    <li>PostgreSql</li>
    <li>MongoDB</li>
    <li>Redis</li>
    <li>Docker</li>
</ul>
<h5> Frontend Techologies </h5>
<ul>
    <li>Node.js 22.x</li>
    <li>npm 10.x or newer</li>
    <li>JavaScript</li>
    <li>React</li>
    <li>Bootstrap</li>
    <li>Redux</li>
</ul>

## Usage Of Technologies In Project
There are 5 services in this project and each service 
are written with N-layered architecture. Spring Cloud
used for microservice infrastructure.
Netflix Eureka Server used to create eureka server. This 
eureka server contains movie service, user service and email service
eureka clients and api-gateway service. In addition,
Zipkin and Micrometer Tracing were used to monitor cross-service logs. Also,
Resilience4j used as Circuit Breaker.
<br>
<br>
In the Api Gateway, Spring Cloud Gateway was used for managing
requests.
<br>
<br>
In the Eureka Server, Netflix Eureka Server was used. And Spring
Security was used to secure eureka server.
<br>
<br>
WebFlux was used for communication between Movie and User Services.
And, Apache Kafka was used for asynchronous communication
between Movie and Email Services.
<br>
<br>
In the User Service, MongoDB used as database. Spring Security
was used for encrypting user's passwords and generating Jwt token.
<br>
<br>
In the Movie Service, PostgreSql used as database and Spring Data Jpa
was used. Webflux and Apache Kafka was used for communication with other services.
Resilience4J Circuit Breaker was used here. Displaying and coming soon movies
are cached using with Redis.
<br>
<br>
In the Email Service, Apache Kafka was used for receiving the 
message from Movie Service. Java Mail Sender and FreeMarker template 
was used for creating email template and sending email.
<br>
<br>
PostgreSql, MongoDB, Apache Kafka and Zipkin run as Docker container
in the docker-compose.yml file.

On the Frontend side, JavaScript and React was used. Also,
Axios was preferred to send request to the backend. For state management,
Redux was used. For, design of the UI, Bootstrap and Css are used.

## Architectural Design
<p align="center">
    <img src="architectural_design.jpeg" />
</p>

## How can I use the Project ?
Download the source code of project. Open this project with your 
favorite IDE. This project is configured for the following local tool versions:

<ul>
    <li>Java: OpenJDK 21 LTS, for example Temurin 21.0.10</li>
    <li>Maven: Apache Maven 3.9.x, for example Maven 3.9.14</li>
    <li>Node.js: Node 22.x, for example Node 22.11.0</li>
    <li>npm: npm 10.x or newer</li>
    <li>Docker Desktop for Windows, with Docker Compose v2</li>
</ul>

After installing them, check your terminal:

    java --version
    mvn --version
    node --version
    npm --version
    docker --version
    docker compose version

And, follow these steps:

<h3>Install or fix required tools on Windows</h3>

<p>
If Java and Maven already show the versions above, no extra Java setup is needed.
If Node is installed but <code>npm --version</code> fails, repair Node.js by installing
the current Node.js 22 LTS installer from <a href="https://nodejs.org/">nodejs.org</a>,
or run npm through the installed Node.js folder while you repair the broken npm shim:

    "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" --version

If that command works, reinstalling Node.js normally fixes the standard <code>npm</code>
command. You can also run <code>corepack enable</code> and reinstall Node if npm is still missing.
</p>

<p>
Install Docker Desktop from <a href="https://www.docker.com/products/docker-desktop/">docker.com</a>.
During installation, keep the WSL 2 backend enabled. Restart your terminal after installation.
If <code>docker</code> is still not recognized, make sure Docker Desktop is running and that
Docker's command line tools are available on your Windows PATH.
</p>

<ol>
    <h3> <li>Build backend services</li> </h3>
<p>
From the project root, build all Spring services with Java 21:

    mvn clean package

If you only want to compile without running tests:

    mvn clean package -DskipTests
</p>

    <h3> <li>Run docker-compose.yml file</li> </h3>
<p>
This docker compose file is necessary to run postgre, mongo, 
kafka, redis and zipkin. Open cmd in the project directory and type

    docker compose up -d

command to run the containers.
</p>

 <h3> <li>Run Eureka Server</li> </h3>
<p>
    Go to EurekaServerApplication class which is in eureka-server module
and run this class to create eureka server. If you want to display
eureka server panel, you can go to <b>localhost:8080/eureka/web </b> or
<b>localhost:8761</b> addresses. Then, enter username= <b>eureka</b> and 
password= <b>password</b>.

</p>

 <h3> <li>Run Api Gateway</li> </h3>
<p>
   To forward the requests to the relevant services, Gateway must be 
run. Go to ApiGatewayApplication class which is in api-gateway modules
and run this class. If you want to check that the api-gateway is registered 
to the eureka server, you can display the eureka server panel.
</p>

 <h3> <li>Run Movie Service</li> </h3>
<p> 
To run movie service go to movie service module. And, run 
MovieServiceApplication class.
</p>

<h3> <li>Run User Service</li> </h3>
<p> 
In the user service module, find UserServiceApplication class and run this
class.
</p>

<h3> <li>Run Email Service</li> </h3>
<p> 
EmailServiceApplication class is in email service module. To run email service module,
run this class.
</p>

<h3> <li>Run Email Service</li> </h3>
<p> 
EmailServiceApplication class is in email service module. To run email service module,
run this class. If this module is started successfully, you can view 
all running services in the eureka server using with eureka panel which is
running on localhost:8761 or localhost:8080/eureka/web.
</p>
<h5>Important Note: <br>
Change mail configurations in application.yml file with your own configurations.
</h5>

<h3> <li>Start React (Frontend) Application</li> </h3>
<p> 
Go to frontend package which is the location of frontend code.
Firstly, type

    npm install

command in cmd for downloading package.json dependencies. Then, To start
the React app, type

    npm start

command. After that, npm will start your React Application
on <b> localhost:3000 </b>.

</p>


</ol>


## Project UI

https://user-images.githubusercontent.com/79381882/194945895-f7e2d2d2-4899-4ade-8c79-ecb647949ffd.mp4

<h4>Main Page</h4>

<img src="homa_page.jpg">

[For more UI Images](https://github.com/VonHumbolt/CineSagaMicroserviceProject/tree/main/frontend)
