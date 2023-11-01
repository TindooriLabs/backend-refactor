#!/bin/bash

printenv DATABASE_URL
while ! npx prisma migrate deploy 
do  
    npx prisma migrate reset
    sleep 2
done

npx prisma generate
