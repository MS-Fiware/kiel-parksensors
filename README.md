# kiel-parksensors

[![License badge](https://img.shields.io/github/license/telefonicaid/fiware-orion.svg)](https://opensource.org/licenses/AGPL-3.0)
[![SOF support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/orion.svg)](http://stackoverflow.com/questions/tagged/fiware-orion)
[![NGSI v2](https://nexus.lab.fiware.org/repository/raw/public/badges/specifications/ngsiv2.svg)](http://fiware-ges.github.io/orion/api/v2/stable/)
[![NGSI-LD badge](https://img.shields.io/badge/NGSI-LD-red.svg)](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.02.01_60/gs_cim009v010201p.pdf)

Node.js script that periodically queries states of parking spots on "Kiellinie" in Kiel and imports transformed data both into [FIWARE Orion v2](https://github.com/telefonicaid/fiware-orion) and [FIWARE Orion-LD](https://github.com/FIWARE/context.Orion-LD) context broker. Optional storage of NGSI v2 time series data in a [CrateDB](https://crate.io/) via [QuantumLeap API](https://github.com/smartsdk/ngsi-timeseries-api) is also supported.  

The Node.js script and the context brokers run in separated Docker containers which in turn are composed within the included Docker Compose files.

## Content

-   [Prerequisites](#prerequisites)
-   [Operation modes](#operation-modes)
-   [Configuration](#configuration)
-   [Starting Docker containers](#starting-docker-containers)
-   [Reading data from context brokers](#reading-data-from-context-brokers)
-   [History data](#history-data)
-   [Troubleshooting](#troubleshooting)

## Prerequisites ##

[Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose) must be installed on your system in order to run the services defined in the multi-container file. Tests have been made with Docker version 18.09.7, build 2d0083d and docker-compose version 1.23.1, build b02f1306.


## Operation modes ##

The project offers two different compose files. The first variant starts the Node.js script, both versions of the context brokers and components for persisting parking status data. In this mode (client-server mode), the retrieved parking data is stored in the context brokers of the local Docker containers and, if configured, persisted in the local CrateDB instance.<br><br>

The second variant comprises a single service for the Node.js script. It acts as a client to context brokers running elsewhere (client mode).


## Configuration ##

ToDo (config.env)


## Starting Docker containers ##

Depending on what operation mode is preferred, pull/create the images and start containers by running `./services create && ./services start` (client-server mode) or simply `./services-app-only start` (client mode) from the project root folder.<br>
To stop the containers run `./services[-app-only] stop`.<br>
If you encounter problems executing the service scripts, add the missing permission with `chmod +x services*`.


## Reading data from context brokers ##

You can GET a list of all ParkingSpot entities using the following cURL commands. Don't forget to replace the `<DOCKER_HOST>` placeholders with the hostname / IP of your Docker host.<br>
`<DOCKER_HOST>` assumes that you are running your own context brokers on the Docker host. If you are connecting to context brokers located elsewhere, use their hostname / IP address accordingly.


### Orion v2 ###
List all ParkingSpot entities containing only the 'id' attribute:  

``` bash
curl -X GET '<DOCKER_HOST>:1026/v2/entities?type=ParkingSpot&attrs=id&options=keyValues' \
  -H 'Accept: application/json'
```
  
List all ParkingSpot entities containing all attributes:  

``` bash
curl -X GET '<DOCKER_HOST>:1026/v2/entities?type=ParkingSpot&options=keyValues' \
  -H 'Accept: application/json'
```


### Orion LD ###
List all ParkingSpot entities containing only the 'id' and 'name' attributes:  

``` bash
curl -X GET '<DOCKER_HOST>:1027/ngsi-ld/v1/entities?type=ParkingSpot&attrs=id,name&options=keyValues' \
  -H 'Accept: application/ld+json' \
  -H 'Link: <https://schema.lab.fiware.org/ld/context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
```

List all ParkingSpot entities containing all attributes:  

``` bash
curl -X GET '<DOCKER_HOST>:1027/ngsi-ld/v1/entities?type=ParkingSpot&options=keyValues' \
  -H 'Accept: application/ld+json' \
  -H 'Link: <https://schema.lab.fiware.org/ld/context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
```


## History data ##

ToDo (CrateDB)


## Troubleshooting ##

CrateDB service might crash shortly after startup due to incompatible memory settings.<br>
With `docker ps -a` you can check whether its container is running or has already exited. In the latter case, inspecting the container log file with 

``` bash
sudo vi `docker inspect --format='{{.LogPath}}' kipark-db-crate`
```

should give you an output saying something like<br>
`max virtual memory areas vm.max_map_count [65530] likely too low, increase to at least [262144]`.<br><br>

In order to avoid this, increase maximum number of memory map areas before starting:

``` bash
sudo sysctl -w vm.max_map_count=262144
```

