#!/bin/bash

printenv DATABASE_URL

while ! npx prisma migrate reset -f
do  
    sleep 2
done

npx prisma migrate deploy

npx prisma generate
