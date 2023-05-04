# Local configuration

This documentation outlines how advanced users can run siibra-explorer targeted at a siibra-configuration directory on their own machine

!!! info
    siibra-configuration only contain atlas metadata. As a result, the procedure described in this document still requires an active internet connection to function.

## Why

Advanced users may wish to run local instances of siibra-explorer against local siibra-configuration for any number of reasons:

- Data cannot yet be made public
- Testing the integration of atlas/template/parcellation/features
- etc

## Prerequisite

- This document assumes the user validated that the configuration is visible in siibra-python (TODO add link).
- Docker & docker-compose

## Steps

- copy the [docker-compose.yml](docker-compose.yml) file to your working directory
- replace `</path/to/your/volume/>` with path to siibra-configuration on your machine
- run `docker-compose up -d`
- siibra-explorer should be running on http://localhost:10082
- to teardown, run `docker-compose down`

!!! info
    First visit of each endpoints of cold started siibra-api often takes very long. The result is cached by by redis middleware, and subsequent visits will result in millisecond response time. If at first the page does not load, try refreshing once every 5 second.

!!! info
    If you make any changes to the configuration, you will have to teardown and restart.
