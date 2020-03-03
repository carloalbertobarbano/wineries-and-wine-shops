#!/bin/sh

docker run \
    --name virtuoso \
    --interactive \
    --tty \
    --env DBA_PASSWORD=mysecret \
    --publish 1111:1111 \
    --publish  8890:8890 \
    --volume $(pwd)/virtuoso-data:/database \
    --volume $(pwd):/usr/share/proj \
    openlink/virtuoso-opensource-7:latest
