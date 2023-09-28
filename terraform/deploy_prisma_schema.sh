#!/bin/bash

echo "DATABASE_URL = postgresql://postgres:testpassword@${some_address}:5432/postgres" >> /etc/environment
npx prisma migrate deploy
npx prisma generate