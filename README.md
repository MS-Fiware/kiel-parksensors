<h2 align="center">
  <a href="https://smart-maas.eu/en/"><img src="https://github.com/SmartMaaS-Services/Transaction-Context-Manager/blob/main/docs/images/Header.jpeg" alt="Smart MaaS" width="500"></a>
  <br>
      SMART MOBILITY SERVICE PLATFORM
  <br>
  <a href="https://smart-maas.eu/en/"><img src="https://github.com/SmartMaaS-Services/Transaction-Context-Manager/blob/main/docs/images/Logos-Smart-MaaS.png" alt="Smart MaaS" width="250"></a>
  <br>
</h2>

<p align="center">
  <a href="mailto:info@smart-maas.eu">Contact</a> •
  <a href="https://github.com/SmartMaaS-Services/Transaction-Context-Manager/issues">Issues</a> •
  <a href="https://smart-maas.eu/en/">Project Page</a>
</p>


***

<h1 align="center">
  <a>
    kiel-parksensors
  </a>
</h1>

***


[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://spdx.org/licenses/MIT.html)
[![Support badge]( https://img.shields.io/badge/support-sof-yellowgreen.svg)](http://stackoverflow.com/questions/tagged/fiware-orion)
[![NGSI v2](https://img.shields.io/badge/NGSI-V2-red.svg)](http://fiware-ges.github.io/orion/api/v2/stable/)
[![NGSI-LD badge](https://img.shields.io/badge/NGSI-LD-red.svg)](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.02.01_60/gs_cim009v010201p.pdf)

Node.js script that periodically queries states of parking spots on "Kiellinie" in Kiel and imports transformed data both into [FIWARE Orion v2](https://github.com/telefonicaid/fiware-orion) and [FIWARE Orion-LD](https://github.com/FIWARE/context.Orion-LD) context broker. Optional storage of NGSI v2 time series data in a [CrateDB](https://crate.io/) via [QuantumLeap API](https://github.com/smartsdk/ngsi-timeseries-api) is also supported.  

The Node.js script and the context brokers run in separated Docker containers which in turn are composed within the included Docker Compose files.

<b>Important note:</b> Unfortunately, the API key provided for querying the parking sensor data has been invalid since the end of June 2020 (as of 13 August 2020). You may be lucky and get a new one from the data provider [Stadtwerke Kiel](https://www.stadtwerke-kiel.de/swk/de/).

## Content

-   [Prerequisites](#prerequisites)
-   [Operation modes](#operation-modes)
-   [Configuration](#configuration)
-   [Starting Docker containers](#starting-docker-containers)
-   [Reading data from context brokers](#reading-data-from-context-brokers)
-   [History data](#history-data)
-   [Troubleshooting](#troubleshooting)
-   [License](#license)

## Prerequisites ##

[Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose) must be installed on your system in order to run the services defined in the multi-container file. Tests have been made with Docker version 18.09.7, build 2d0083d and docker-compose version 1.23.1, build b02f1306.


## Operation modes ##

The project offers two different compose files. The first variant starts the Node.js script, both versions of the context brokers and components for persisting parking status data. In this mode (client-server mode), the retrieved parking data is stored in the context brokers of the local Docker containers and, if configured, persisted in the local CrateDB instance.<br>

The second variant comprises a single service for the Node.js script. It acts as a client to context brokers running elsewhere (client mode).


## Configuration ##

There is a configuration file `config.env` containing environment variables used by the Node.js script. Some of the variables values have to be modified prior to initial startup, as the script uses those variables for connection management and data processing.<br>

The following list gives a summary of currently supported variables and their description:

<table>
  <tbody>
    <tr>
      <th>Name</th>
      <th>Description</th>
      <th>Default value</th>
    </tr>
    <tr>
      <th colspan="3">Park Sensors Data Source</th>
    </tr>
    <tr>
      <td>
        <code>PARKSENSORS_BASE_URL</code>
      </td>
      <td>
        <p>base URL (park sensors data source)</p>
        <p><i>mandatory</i></p>
      </td>
      <td>
         https://element-iot.com/api/v1/tags/stadt-kiel-parksensorik-kiellinie
      </td>
    </tr>
    <tr>
      <td>
        <code>PARKSENSORS_API_KEY</code>
      </td>
      <td>
        <p>API key (token for authenticaton)</p>
        <p><i>mandatory</i></p>
      </td>
      <td>
        645a23ee6da141b6865fa68101c34ab7
      </td>
    </tr>
    <tr>
      <td>
        <code>PARKSENSORS_QUERY_INTERVAL</code>
      </td>
      <td>
        <p>interval for querying park sensor states [seconds]</p>
        <p><i>mandatory</i></p>
      </td>
      <td>
        60
      </td>
    </tr>
    <tr>
      <th colspan="3">NGSI v2 Context Broker</th>
    </tr>
    <tr>
      <td>
        <code>BROKER_V2_URL</code>
      </td>
      <td>
        <p>NGSI v2 context broker URL</p>
        <p>NOTE: modify ONLY, when communicating with external context brokers, e.g. when executing <code>'./services-app-only'</code> which does NOT start any context broker!<br>
          If this broker should not be used, just set an empty value.</p>
        <p><i>optional</i></p>
      </td>
      <td>
        http://orion-v2:1026
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_V2_AUTH_KEY</code>
      </td>
      <td>
        <p>Auth key for 'Authorization' header</p>
        <p><i>optional</i></p>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_V2_API_KEY</code>
      </td>
      <td>
        <p>API key (token for authenticaton)</p>
        <p><i>optional</i></p>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_V2_TENANT</code>
      </td>
      <td>
        <p>tenant name (a tenant is a service aka domain on the context broker with its own isolated logical database)</p>
        <p><i>optional</i></p>
      </td>
      <td>
        kiel
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_V2_SUBTENANT</code>
      </td>
      <td>
        <p>sub-tenant name (a sub-tenant is a sub-service / service path aka project for the given tenant)</p>
        <p><i>optional</i></p>
      </td>
      <td>
        /parkingspots
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_V2_ENTITY_ID_SUFFIX</code>
      </td>
      <td>
        <p>entity ID suffix (on creation will be appended to an entitys ID for a customized identification format, e.g. the ID suffix 'XY' for a ParkingSpot entity 'parksensor-2b2f' will result in 'ParkingSpot:parksensor-2b2f-XY')</p>
        <p><i>optional</i></p>
      </td>
      <td>
        XY
      </td>
    </tr>
    <tr>
      <th colspan="3">NGSI-LD Context Broker</th>
    </tr>
    <tr>
      <td>
        <code>BROKER_LD_URL</code>
      </td>
      <td>
        <p>NGSI-LD context broker URL</p>
        <p>NOTE: modify ONLY, when communicating with external context brokers, e.g. when executing <code>'./services-app-only'</code> which does NOT start any context broker!<br>
          If this broker should not be used, just set an empty value.</p>
        <p><i>optional</i></p>
      </td>
      <td>
        http://orion-ld:1026
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_LD_AUTH_KEY</code>
      </td>
      <td>
        <p>Auth key for 'Authorization' header</p>
        <p><i>optional</i></p>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_LD_API_KEY</code>
      </td>
      <td>
        <p>API key (token for authenticaton)</p>
        <p><i>optional</i></p>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_LD_TENANT</code>
      </td>
      <td>
        <p>tenant name (a tenant is a service aka domain on the context broker with its own isolated logical database)</p>
        <p><i>optional</i></p>
      </td>
      <td>
        kiel
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_LD_SUBTENANT</code>
      </td>
      <td>
        <p>sub-tenant name (a sub-tenant is a sub-service / service path aka project for the given tenant)</p>
        <p><i>optional</i></p>
      </td>
      <td>
        /parkingspots
      </td>
    </tr>
    <tr>
      <td>
        <code>BROKER_LD_ENTITY_ID_SUFFIX</code>
      </td>
      <td>
        <p>entity ID suffix (on creation will be appended to an entitys ID for a customized identification format, e.g. the ID suffix 'XY' for a ParkingSpot entity 'parksensor-2b2f' will result in 'urn:ngsi-ld:ParkingSpot:parksensor-2b2f-XY')</p>
        <p><i>optional</i></p>
      </td>
      <td>
        XY
      </td>
    </tr>
    <tr>
      <th colspan="3">Historic data persistence</th>
    </tr>
    <tr>
      <td>
        <code>ENABLE_HISTORIC_DATA_STORAGE</code>
      </td>
      <td>
        <p>enables storage of historic data (into Crate-DB via QuantumLeap API for now) - support for NGSI v2 data only</p>
        <p><i>optional</i></p>
      </td>
      <td>
        true
      </td>
    </tr>
    <tr>
      <td>
        <code>QL_V2_NOTIFICATION_URL</code>
      </td>
      <td>
        <p>QuantumLeap (QL) notification URL used for sending status changes of entities in the context broker</p>
        <p>NOTE: modify ONLY, when communicating with external QL instances, e.g. when executing <code>'./services-app-only'</code> which does NOT start any QL instance!<br>
          If historic data persistence via QL is not wanted, just set an empty value.</p>
        <p><i>optional</i></p>
      </td>
      <td>
        http://quantumleap:8668
      </td>
    </tr>
    <tr>
      <td>
        <code>QL_V2_AUTH_KEY</code>
      </td>
      <td>
        <p>Auth key for 'Authorization' header in requests to QL</p>
        <p><i>optional</i></p>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <code>QL_V2_API_KEY</code>
      </td>
      <td>
        <p>API key for authentication on QL</p>
        <p><i>optional</i></p>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <code>QL_V2_TENANT</code>
      </td>
      <td>
        <p>tenant name on QL</p>
        <p><i>optional</i></p>
      </td>
      <td>
        kiel
      </td>
    </tr>
    <tr>
      <td>
        <code>QL_V2_SUBTENANT</code>
      </td>
      <td>
        <p>sub-tenant name on QL</p>
        <p><i>optional</i></p>
      </td>
      <td>
        /parkingspots
      </td>
    </tr>
  </tbody>
</table>


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

If historic data persistence was enabled, the Node.js script sends subscriptions for status changes of all known ParkingSpot entities to the NGSI v2 context broker. QuantumLeap, a REST service for storing, querying and retrieving spatial-temporal data, will receive a notification every time a status changes and stores its current value in a CrateDB database. With this data collected over time, statistical evaluations and data visualisation will be possible, e.g. building histograms with [Grafana](https://grafana.com/) or UI widgets using [WireCloud](https://github.com/Wirecloud/wirecloud).<br>

As QuantumLeap has no support for NGSI-LD yet, storage of historic data is supported for NGSI v2 data only.<br>

The Docker container of CrateDB exposes 4200 as the default port for data queries and access to the web-based admin UI.<br>
You can reach it at `<DOCKER_HOST>:4200`.


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


## License ##

This project is licensed under [MIT License](./LICENSE).
