#!/bin/bash
# update system packages
sudo apt-get update -y && sudo apt-get upgrade -y

curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" |sudo tee  /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt -y install postgresql-12 postgresql-client-12

sudo -u postgres psql template1
CREATE USER 'tindoori-labs-user' WITH ENCRYPTED PASSWORD 'md50d9a55ff4c0c65fedefd75d71845c7a4';
ALTER USER tindoori-labs-user WITH SUPERUSER;

# Backup PostgreSQL authentication config file
mv /etc/postgresql/12/main/pg_hba.conf /etc/postgresql/12/main/pg_hba.bak

# Create our new PostgreSQL authentication config file
cat <<'EOF' > /etc/postgresql/12/main/pg_hba.conf
${pg_hba_file}
EOF

# Update the IPs of the address to listen from PostgreSQL config
sed -i "59i listen_addresses = '${allowed_ip}'" /etc/postgresql/12/main/postgresql.conf

# Start the db service
sudo systemctl restart postgresql.service