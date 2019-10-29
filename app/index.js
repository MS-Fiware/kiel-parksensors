const axios = require('axios');



// give other required services some time (20 seconds) to get started before trying to connect to them
setTimeout(() => {
    // environment variables read during runtime
    const {
        // base URL (park sensors data source)
        PARKSENSORS_BASE_URL,
        // API key for authentication (park sensors data source)
        PARKSENSORS_API_KEY,
        // interval for querying park sensor states [seconds]
        PARKSENSORS_QUERY_INTERVAL,

        // NGSI v2 context broker URL
        BROKER_V2_URL,
        // API key for authentication (NGSI-V2 context broker)
        BROKER_V2_API_KEY,
        // tenant name on NGSI-V2 context broker (a tenant is a service aka domain on the context broker with its own isolated logical database)
        BROKER_V2_TENANT,
        // sub-tenant name on NGSI-V2 context broker (a sub-tenant is a sub-service / service path aka project for the given tenant)
        BROKER_V2_SUBTENANT,
        // entity ID suffix (on creation will be appended to an entitys ID for a customized identification format, e.g. the ID suffix 'XY' for a ParkingSpot entity 'parksensor-2b2f' will result in 'ParkingSpot:parksensor-2b2f-XY')
        BROKER_V2_ENTITY_ID_SUFFIX,

        // NGSI-LD context broker URL
        BROKER_LD_URL,
        // API key for authentication (NGSI-LD context broker)
        BROKER_LD_API_KEY,
        // tenant name on NGSI-LD context broker (a tenant is a service aka domain on the context broker with its own isolated logical database)
        BROKER_LD_TENANT,
        // sub-tenant name on NGSI-LD context broker (a sub-tenant is a sub-service / service path aka project for the given tenant)
        BROKER_LD_SUBTENANT,
        // entity ID suffix (on creation will be appended to an entitys ID for a customized identification format, e.g. the ID suffix 'XY' for a ParkingSpot entity 'parksensor-2b2f' will result in 'urn:ngsi-ld:ParkingSpot:parksensor-2b2f-XY')
        BROKER_LD_ENTITY_ID_SUFFIX,

        // enables storage of historic data (into Crate-DB via QuantumLeap API for now) - support for NGSI v2 data only
        ENABLE_HISTORIC_DATA_STORAGE,
        // QuantumLeap notification URL used for sending status changes of entities in the context broker
        QL_V2_NOTIFICATION_URL
      } = process.env;

    // states of park sensors (specified by https://github.com/smart-data-models/dataModel.Parking/blob/master/ParkingSpot/doc/spec.md)
    const PARKSENSOR_STATES = { 0: 'free', 
                                1: 'occupied' };

    // context brokers
    const BROKERS = { v2: [BROKER_V2_URL], 
                      ldv1: [BROKER_LD_URL] };



    /**
     * Executes a RESTful HTTP request
     * @param {*} method 
     * @param {*} url 
     * @param {*} headers 
     * @param {*} body 
     */
    function executeRestRequest(method, url, headers, body) {
        if (!axios) {
            console.error('executeRestRequest - ERROR: axios library not found');
        }
        if (!method) {
            console.error('executeRestRequest - ERROR: no HTTP method given');
        }
        if (!url) {
            console.error('executeRestRequest - ERROR: no request URL given');
        }

        let requestConfig = {
            method: method,
            url: url,
            headers: headers
        };
        if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
            requestConfig.data = body;
        }

        console.info(`\n==> trying to ${method}: '${url}'`);
        console.info(`=> headers: ${JSON.stringify(headers)}`);
        console.info(`=> body: ${JSON.stringify(body)}`);

        return new Promise((resolve, reject) => {
            axios.request(requestConfig)
            .then(response => {
                console.info('\n==> RESPONSE');
                if (response.error) {
                    console.error(response);
                } else {
                    console.info(`=> status code: ${response.status}`);
                    console.info(`=> status message: '${response.statusText}'`);
                    console.info(`=> headers: ${JSON.stringify(response.headers)}`);
                    console.info(`=> body:\n${JSON.stringify(response.data)}`);
                }
                resolve(response);
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    }

    // query park sensors states
    function readParksensors() {
        let path = `/devices?last_readings=1&limit=100&auth=${PARKSENSORS_API_KEY}`;
        return executeRestRequest('GET', PARKSENSORS_BASE_URL + path, {'Accept': 'application/json'}, null);
    }

    // transform a read park sensor to a NGSI v2 compliant object
    function transformParksensor_NGSI_v2(sensor) {
        if (sensor) {
            let transformedSensor = {};

            transformedSensor['id'] = 'ParkingSpot:' + sensor.slug + (BROKER_V2_ENTITY_ID_SUFFIX ? '-' + BROKER_V2_ENTITY_ID_SUFFIX : '');
            transformedSensor['name'] = {
                "type": 'Text',
                "value": sensor.name
            };
            transformedSensor['type'] = 'ParkingSpot';
            transformedSensor['category'] = {
                "type": 'Text',
                "value": 'onstreet'
            };
            //TODO: add 'refParkingSite' attribute (mandatory)
            transformedSensor['location'] = {
                "type": 'geo:json',
                "value": {
                    "type": sensor.location.type,
                    "coordinates": [sensor.location.coordinates[0], sensor.location.coordinates[1]]
                }
            };
            transformedSensor['status'] = {
                "type": 'Text',
                "value": PARKSENSOR_STATES[sensor.last_readings[0].data.map_state] ? 
                            PARKSENSOR_STATES[sensor.last_readings[0].data.map_state] : 'undefined',
                "metadata": {
                    "timestamp": {
                        "type": 'DateTime',
                        "value": new Date(sensor.last_readings[0].inserted_at).toISOString()
                    }
                }
            };

            return transformedSensor;
        } else {
            return null;
        }
    }

    // transform a read park sensor to a NGSI-LD compliant object
    function transformParksensor_NGSI_LDv1(sensor) {
        if (sensor) {
            let transformedSensor = {};

            transformedSensor['id'] = 'urn:ngsi-ld:ParkingSpot:' + sensor.slug + (BROKER_LD_ENTITY_ID_SUFFIX ? '-' + BROKER_LD_ENTITY_ID_SUFFIX : '');
            transformedSensor['name'] = {
                "type": 'Property',
                "value": sensor.name
            };
            transformedSensor['type'] = 'ParkingSpot';
            transformedSensor['category'] = {
                "type": 'Property',
                "value": 'onstreet'
            };
            //TODO: add 'refParkingSite' attribute (mandatory)
            transformedSensor['location'] = {
                "type": 'GeoProperty',
                "value": {
                    "type": sensor.location.type,
                    "coordinates": [sensor.location.coordinates[0], sensor.location.coordinates[1]]
                }
            };
            transformedSensor['status'] = {
                "type": 'Property',
                "value": PARKSENSOR_STATES[sensor.last_readings[0].data.map_state] ? 
                            PARKSENSOR_STATES[sensor.last_readings[0].data.map_state] : 'undefined',
                "observedAt": new Date(sensor.last_readings[0].inserted_at).toISOString()
            };
            transformedSensor['@context'] = [
                "https://schema.lab.fiware.org/ld/context",
                "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ];

            return transformedSensor;
        } else {
            return null;
        }
    }

    // set headers of a request to the NGSI v2 broker
    function setHeaders_CB_NGSI_v2(headers) {
        headers = headers || {};

        // set additional headers
        if (BROKER_V2_API_KEY) {
            headers['X-Api-Key'] = BROKER_V2_API_KEY;
        }
        if (BROKER_V2_TENANT) {
            headers['Fiware-Service'] = BROKER_V2_TENANT;
        }
        if (BROKER_V2_SUBTENANT) {
            headers['Fiware-Servicepath'] = BROKER_V2_SUBTENANT;
        }

        return headers;
    }

    // set headers of a request to the NGSI-LD broker
    function setHeaders_CB_NGSI_LDv1(headers) {
        headers = headers || {};

        // set additional headers
        if (BROKER_LD_API_KEY) {
            headers['X-Api-Key'] = BROKER_LD_API_KEY;
        }
        if (BROKER_LD_TENANT) {
            headers['Fiware-Service'] = BROKER_LD_TENANT;
        }
        if (BROKER_LD_SUBTENANT) {
            headers['Fiware-Servicepath'] = BROKER_LD_SUBTENANT;
        }

        return headers;
    }

    function getExistingParksensorIds_CB_NGSI_v2(baseUrl) {
        let path = '/v2/entities?type=ParkingSpot&attrs=id&options=keyValues';
        let headers = setHeaders_CB_NGSI_v2({'Accept': 'application/json'});
        return executeRestRequest('GET', baseUrl + path, headers, null);
    }

    function getExistingParksensorIds_CB_NGSI_LDv1(baseUrl) {
        // BUG?: trying to list all data entities limited to id attribute (attrs=id) returns an empty array, when providing another attribute (despite of 'type', e.g. attrs=id,name) a filled array is returned
        let path = '/ngsi-ld/v1/entities?type=ParkingSpot&attrs=id,name&options=keyValues';
        let headers = setHeaders_CB_NGSI_LDv1({'Accept': 'application/ld+json', 
                                                'Link': '<https://schema.lab.fiware.org/ld/context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
                                            });
        return executeRestRequest('GET', baseUrl + path, headers, null);
    }

    async function postParksensors_CB_NGSI_v2(baseUrl, parkSensors) {
        let path = '/v2/op/update';
        let headers = setHeaders_CB_NGSI_v2({'Content-Type': 'application/json'});
        return executeRestRequest('POST', baseUrl + path, headers, JSON.stringify({'actionType': 'append_strict', 'entities': parkSensors}));
    }

    function postParksensors_CB_NGSI_LDv1(baseUrl, parkSensors) {
        let path = '/ngsi-ld/v1/entities';
        let headers = setHeaders_CB_NGSI_LDv1({'Content-Type': 'application/ld+json'});
        // post entities individually as batch operations are not implemented yet 
        // (status 12.09.2019, supposedly finished by Christmas this year)
        return Promise.all(parkSensors.map(sensor => {
            return executeRestRequest('POST', baseUrl + path, headers, JSON.stringify(sensor));
        }));
    }

    // subscribe for status changes of ParkingSpot entities in a NGSI v2 broker
    function subscribeParksensorsStatusChange_CB_NGSI_v2(baseUrl) {
        let path = '/v2/subscriptions';
        let headers = setHeaders_CB_NGSI_v2({'Content-Type': 'application/json'});

        let subscription = {};

        subscription['description'] = 'Notify QuantumLeap of status changes of any ParkingSpots' + (BROKER_V2_ENTITY_ID_SUFFIX ? ' with entity ID suffix: ' + BROKER_V2_ENTITY_ID_SUFFIX : '');
        subscription['subject'] = {
            "entities": [
                {
                    "idPattern": 'ParkingSpot' + (BROKER_V2_ENTITY_ID_SUFFIX ? '.*-' + BROKER_V2_ENTITY_ID_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '.*'),
                    "type": 'ParkingSpot'
                }
            ],
            "condition": {
                "attrs": ['status']
            }
        };
        subscription['notification'] = {
            "http": {
                "url": QL_V2_NOTIFICATION_URL + '/v2/notify'
            },
            "metadata": ['dateCreated', 'dateModified']
        };
        subscription['throttling'] = 1;

        return executeRestRequest('POST', baseUrl + path, headers, JSON.stringify(subscription));
    }

    function patchParksensors_CB_NGSI_v2(baseUrl, parkSensors) {
        let headers = setHeaders_CB_NGSI_v2({'Content-Type': 'application/json'});
        return Promise.all(parkSensors.map(sensor => {
            if (sensor && sensor.id && sensor.status && sensor.status.metadata && sensor.status.metadata.timestamp) {
                let path = `/v2/entities/${sensor.id}/attrs`;
                return executeRestRequest('PATCH', baseUrl + path, headers, 
                        JSON.stringify({
                            'status': {
                                'type': 'Text',
                                'value': sensor.status.value,
                                'metadata': {
                                    'timestamp': {
                                        'type': 'DateTime',
                                        'value': sensor.status.metadata.timestamp.value
                                    }
                                }
                            }
                        }));
            }
        }));
    }

    function patchParksensors_CB_NGSI_LDv1(baseUrl, parkSensors) {
        let headers = setHeaders_CB_NGSI_LDv1({'Content-Type': 'application/ld+json'});
        return Promise.all(parkSensors.map(sensor => {
            if (sensor && sensor.id && sensor.status) {
                let path = `/ngsi-ld/v1/entities/${sensor.id}/attrs`;
                return executeRestRequest('PATCH', baseUrl + path, headers, 
                        JSON.stringify({
                            '@context': 'https://schema.lab.fiware.org/ld/context',
                            'status': {
                                'type': 'Property',
                                'value': sensor.status.value,
                                'observedAt': sensor.status.observedAt
                            }
                        }));
            }
        }));
    }

    // import park sensor data into NGSI v2 broker
    let importParksensorsInto_CB_NGSI_v2 = async function(parkSensors) {
        let transformedParksensors = [];
        parkSensors.forEach(sensor => {
            let transformedSensor = transformParksensor_NGSI_v2(sensor);
            if (transformedSensor) {
                transformedParksensors.push(transformedSensor);
            }
        });

        for (const brokerUrl of BROKERS.v2) {
            if (brokerUrl) {
                // IDs of park sensors that already exist in NGSI v2 broker
                const existingIds = [];
                // park sensors that already exist in NGSI v2 broker and need to be updated by new sensor data
                const sensorsToPatch = [];
                // park sensors that do not exist in NGSI v2 broker and need to be posted
                const sensorsToPost = [];
                // query existing park sensors in NGSI v2 broker
                const response = await getExistingParksensorIds_CB_NGSI_v2(brokerUrl);

                //console.log(typeof response);
                //console.log(JSON.stringify(response));

                if (response && response.data && Array.isArray(response.data)) {
                    response.data.forEach(sensor => {
                        existingIds.push(sensor.id);
                    });
                    transformedParksensors.forEach(tSensor => {
                        // transformed sensor already exists in NGSI v2 broker
                        if (existingIds.includes(tSensor.id)) {
                            sensorsToPatch.push(tSensor);
                        } else {
                            sensorsToPost.push(tSensor);
                        }
                    });

                    if (sensorsToPatch.length) {
                        console.info('importParksensorsInto_CB_NGSI_v2 - INFO: UPDATING EXISTING park sensors in NGSI v2 broker =>');
                        console.info(JSON.stringify(sensorsToPatch));
                        // update existing park sensors objects in context broker
                        patchParksensors_CB_NGSI_v2(brokerUrl, sensorsToPatch);
                    }
                    if (sensorsToPost.length) {
                        console.info('importParksensorsInto_CB_NGSI_v2 - INFO: ADDING NEW park sensors to NGSI v2 broker =>');
                        console.info(JSON.stringify(sensorsToPost));
                        // add new park sensors objects to context broker
                        await postParksensors_CB_NGSI_v2(brokerUrl, sensorsToPost);
                        // subscribe for status changes of ParkingSpot entities in the context broker, if historic data persistence is enabled and notification URL is set
                        if (ENABLE_HISTORIC_DATA_STORAGE && ENABLE_HISTORIC_DATA_STORAGE === 'true' && QL_V2_NOTIFICATION_URL) {
                            subscribeParksensorsStatusChange_CB_NGSI_v2(brokerUrl);
                        }
                    }
                } else {
                    console.error('importParksensorsInto_CB_NGSI_v2 - ERROR: could not query existing park sensors in NGSI v2 broker');
                }
            }
        };
    }

    // import park sensor data into NGSI-LD v1 broker
    let importParksensorsInto_CB_NGSI_LDv1 = async function(parkSensors) {
        let transformedParksensors = [];
        parkSensors.forEach(sensor => {
            let transformedSensor = transformParksensor_NGSI_LDv1(sensor);
            if (transformedSensor) {
                transformedParksensors.push(transformedSensor);
            }
        });

        for (const brokerUrl of BROKERS.ldv1) {
            if (brokerUrl) {
                // IDs of park sensors that already exist in NGSI-LD broker
                const existingIds = [];
                // park sensors that already exist in NGSI-LD broker and need to be updated by new sensor data
                const sensorsToPatch = [];
                // park sensors that do not exist in NGSI-LD broker and need to be posted
                const sensorsToPost = [];
                // query existing park sensors in NGSI-LD broker
                const response = await getExistingParksensorIds_CB_NGSI_LDv1(brokerUrl);

                //console.log(typeof response);
                //console.log(JSON.stringify(response));

                if (response && response.data && Array.isArray(response.data)) {
                    response.data.forEach(sensor => {
                        existingIds.push(sensor.id);
                    });
                    transformedParksensors.forEach(tSensor => {
                        // transformed sensor already exists in NGSI-LD broker
                        if (existingIds.includes(tSensor.id)) {
                            sensorsToPatch.push(tSensor);
                        } else {
                            sensorsToPost.push(tSensor);
                        }
                    });

                    if (sensorsToPatch.length) {
                        console.info('importParksensorsInto_CB_NGSI_LDv1 - INFO: UPDATING EXISTING park sensors in NGSI-LD broker =>');
                        console.info(JSON.stringify(sensorsToPatch));
                        // update existing park sensors objects in context broker
                        patchParksensors_CB_NGSI_LDv1(brokerUrl, sensorsToPatch);
                    }
                    if (sensorsToPost.length) {
                        console.info('importParksensorsInto_CB_NGSI_LDv1 - INFO: ADDING NEW park sensors to NGSI-LD broker =>');
                        console.info(JSON.stringify(sensorsToPost));
                        // add new park sensors objects to context broker
                        postParksensors_CB_NGSI_LDv1(brokerUrl, sensorsToPost);
                    }
                } else {
                    console.error('importParksensorsInto_CB_NGSI_LDv1 - ERROR: could not query existing park sensors in NGSI-LD broker');
                }
            }
        };
    }

    let importParksensorsIntoContextBrokers = async function(parkSensors) {
        if (!Array.isArray(parkSensors)) {
            console.error('importParksensorsIntoContextBrokers - ERROR: \'parkSensors\' not set or not of type Array');
            return;
        }

        // we have an array of NGSI v2 brokers defined -> import park sensor data into brokers
        if (BROKERS.v2.length) {
            importParksensorsInto_CB_NGSI_v2(parkSensors);
        }
        // we have an array of NGSI-LD brokers defined -> import park sensor data into brokers
        if (BROKERS.ldv1.length) {
            importParksensorsInto_CB_NGSI_LDv1(parkSensors);
        }
    }

    async function importSensorData() {
        try {
            const pSensorsResponse = await readParksensors();

            if (pSensorsResponse && pSensorsResponse.data && Array.isArray(pSensorsResponse.data.body)) {
                // import read park sensors into context brokers
            importParksensorsIntoContextBrokers(pSensorsResponse.data.body);
            } else {
                console.warn('importSensorData - WARN: no park sensors data found for transforming');
            }
        } catch(err) {
            console.error(err);
        }
    }

    function init() {
        importSensorData();
        // keep querying / importing park sensor states every PARKSENSORS_QUERY_INTERVAL seconds
        setInterval(importSensorData, PARKSENSORS_QUERY_INTERVAL * 1000);
    }

    init();
}, 20000);

