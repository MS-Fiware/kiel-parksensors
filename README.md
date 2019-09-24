# kiel-parksensors
Node.js script that periodically queries states of parking spots on 'Kiellinie' in Kiel and imports transformed data both into FIWARE Orion v2 and FIWARE Orion LD context broker.

The Node.js script and the context brokers run in docker containers which in turn are composed within the included docker-compose.yml.

To pull/create the images and start the containers simply run `./services create && ./services start` from the project root folder.
To stop the containers run `./services stop`

You can GET a list of all ParkingSpot entities via  
`<docker_host>:1026/v2/entities?type=ParkingSpot&attrs=id&options=keyValues` (for Orion v2)  
`<docker_host>:1027/ngsi-ld/v1/entities?type=ParkingSpot&attrs=id,name&options=keyValues` (for Orion LD)  
