FROM nginx:1.27-alpine

# Patch OS packages in the base image (Trivy scans OS CVEs).
RUN apk update && apk upgrade --no-cache

RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

