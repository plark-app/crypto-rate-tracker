FROM node:10.4.1-alpine

ENV HOST=localhost
ENV PORT=80
ENV SECURE=true

ENV INFLUXDB_HOST=localhost
ENV INFLUXDB_PORT=8086
ENV CURRENCYCONVERTERAPI_API_KEY="provider-api-key"

RUN apk add --no-cache gettext git

WORKDIR /var/www/

COPY . .

RUN npm install
RUN npm run build:prod

RUN envsubst < /var/www/build/.env.template.yml > /var/www/.env.yml

EXPOSE 80

CMD /bin/sh -c "envsubst < /var/www/build/.env.template.yml > /var/www/.env.yml && npm start"
