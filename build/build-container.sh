#!/usr/bin/env bash

NODE_ENV=production
APP_ENV=production

export APPLICATION_VERSION=$(jq -r ".version" package.json)

docker build \
    --file ./Dockerfile \
    --tag plark/crypto-rate-tracker:$APPLICATION_VERSION \
    --tag plark/crypto-rate-tracker .

docker login --username "$DOCKER_USERNAME" --password "$DOCKER_PASSWORD"

docker push plark/crypto-rate-tracker:$APPLICATION_VERSION
docker push plark/crypto-rate-tracker:latest
