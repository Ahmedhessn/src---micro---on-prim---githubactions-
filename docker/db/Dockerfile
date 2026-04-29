FROM mysql:8.4.9-oraclelinux9

# Keep base OS packages patched (Trivy scans this image).
RUN microdnf -y update && microdnf clean all

ENV MYSQL_DATABASE=accounts
COPY src/main/resources/db_backup.sql /docker-entrypoint-initdb.d/db_backup.sql

