# kiel-parksensors
Node.js script that periodically queries states of parking spots on 'Kiellinie' in Kiel and imports transformed data both into FIWARE Orion v2 and FIWARE Orion LD context broker.

The Node.js script and the context brokers run in docker containers which in turn are composed within the included docker-compose.yml.
 

### Starting docker containers ###

To pull/create the images and start the containers simply run `./services create && ./services start` from the project root folder.
To stop the containers run `./services stop`.   
If you encounter problems executing the script, add the missing permission with `chmod +x services`.  


### Reading data from context brokers ###

You can GET a list of all ParkingSpot entities using the following cURL commands. Don't forget to replace the `<DOCKER_HOST>` placeholders with the hostname / IP of your docker host.  

#### Orion v2 ####
_list all ParkingSpot entities containing only the 'id' attribute:_  

`curl -X GET '<DOCKER_HOST>:1026/v2/entities?type=ParkingSpot&attrs=id&options=keyValues' \
  -H 'Accept: application/json'`  
  
_list all ParkingSpot entities containing all attributes:_  

`curl -X GET '<DOCKER_HOST>:1026/v2/entities?type=ParkingSpot&options=keyValues' \
  -H 'Accept: application/json'`  

#### Orion LD ####
_list all ParkingSpot entities containing only the 'id' and 'name' attributes:_  

`curl -X GET '<DOCKER_HOST>:1027/ngsi-ld/v1/entities?type=ParkingSpot&attrs=id,name&options=keyValues' \
  -H 'Accept: application/ld+json' \
  -H 'Link: <https://schema.lab.fiware.org/ld/context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'`  

_list all ParkingSpot entities containing all attributes:_  

`curl -X GET '<DOCKER_HOST>:1027/ngsi-ld/v1/entities?type=ParkingSpot&options=keyValues' \
  -H 'Accept: application/ld+json' \
  -H 'Link: <https://schema.lab.fiware.org/ld/context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'`
