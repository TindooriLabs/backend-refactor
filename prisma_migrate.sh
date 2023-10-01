#!/bin/bash

printenv DATABASE_URL
while ! npx prisma migrate deploy 
do
    sleep 2
done

npx prisma generate