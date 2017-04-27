FROM keymetrics/pm2-docker-alpine

RUN mkdir -p /usr/airscape-mqtt-bridge
COPY . /usr/airscape-mqtt-bridge
WORKDIR /usr/airscape-mqtt-bridge
RUN npm install --production
RUN npm install pm2 -g

CMD ["pm2-docker", "airscape-mqtt-bridge.js"]
