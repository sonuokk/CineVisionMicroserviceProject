FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

COPY pom.xml .
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY emailService/pom.xml emailService/pom.xml
COPY eureka-server/pom.xml eureka-server/pom.xml
COPY movieService/pom.xml movieService/pom.xml
COPY userService/pom.xml userService/pom.xml

RUN mvn -B -pl userService -am dependency:go-offline

COPY userService/src userService/src

RUN mvn -B -pl userService -am package spring-boot:repackage -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /workspace/userService/target/*.jar /app/app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-10000} ${JAVA_OPTS} -jar /app/app.jar"]
