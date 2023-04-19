#!/bin/sh
git pull
docker stop ssa_server
docker rm ssa_server
docker build --tag sales-automation .
docker run --restart unless-stopped -p 8080:8080 -d --name ssa_serve sales-automation   
