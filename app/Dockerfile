FROM node:10.16.3-alpine
RUN mkdir -p /home/node/kiel-parksensors/node_modules && chown -R node:node /home/node/kiel-parksensors
WORKDIR /home/node/kiel-parksensors
COPY package*.json /home/node/kiel-parksensors/
USER node
RUN npm install
COPY --chown=node:node . /home/node/kiel-parksensors
CMD node index.js
