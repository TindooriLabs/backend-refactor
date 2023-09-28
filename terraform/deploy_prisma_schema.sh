#!/bin/bash

echo "DATABASE_URL = postgresql://postgres:testpassword@${db_connection_url}:5432/postgres" >> /etc/environment
npx prisma migrate deploy
npx prisma generate