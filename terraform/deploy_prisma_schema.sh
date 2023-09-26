#!/bin/bash

export DATABASE_URL = ${db_connection_url}
npx prisma migrate deploy