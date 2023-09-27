#!/bin/bash

export DATABASE_URL = "postgresql://postgres:testpassword@$db_connection_url:5432/postgres"
npx prisma migrate deploy