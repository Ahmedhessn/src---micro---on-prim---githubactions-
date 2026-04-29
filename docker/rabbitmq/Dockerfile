# syntax=docker/dockerfile:1.7
FROM rabbitmq:3.13-management

# Patch OS packages in the base image (Trivy scans OS CVEs).
RUN apt-get update \
  && apt-get upgrade -y \
  && rm -rf /var/lib/apt/lists/*

# No extra plugins/config yet; add rabbitmq.conf / definitions.json here when needed.

