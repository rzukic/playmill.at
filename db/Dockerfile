FROM postgres:15

COPY mill.sql /docker-entrypoint-initdb.d/

#RUN psql -U milldaemoun < /docker-entrypoint-initdb.d/mill.sql