#!/bin/bash

printenv DATABASE_URL

while ! prisma migrate deploy
do  
    sleep 2
done

prisma generate
