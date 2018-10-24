#!/usr/bin/env bash

NODE_ENV=production
APP_ENV=production

export APPLICATION_VERSION=$(jq -r ".version" package.json)

docker build \
    --file ./Dockerfile \
    --tag plark/price-tracker:$APPLICATION_VERSION \
    --tag plark/price-tracker .

docker login --username "$DOCKER_USERNAME" --password "$DOCKER_PASSWORD"

docker push berrywallet/price-tracker:$APPLICATION_VERSION
docker push berrywallet/price-tracker:latest
