#!/bin/bash

printenv DATABASE_URL

while ! prisma migrate reset -f
do  
    sleep 2
done

prisma migrate deploy

prisma generate
