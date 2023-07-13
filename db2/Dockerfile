FROM postgres:15

RUN apt-get update && apt-get -y install postgresql-15-cron

COPY initdb /docker-entrypoint-initdb.d/
