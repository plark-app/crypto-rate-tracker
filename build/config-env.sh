#!/usr/bin/env bash

NODE_ENV=production
APP_ENV=production

mkdir -p /nmt/plark-tracker && \
mkdir -p /var/log/plark-tracker && \
mkdir -p /var/log/plark-tracker/web

sudo chmod 777 -R /var/log/plark-tracker && \
sudo chmod 777 -R /mnt/plark-tracker
