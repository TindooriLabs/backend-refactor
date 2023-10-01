#!/bin/bash

while ! npx prisma migrate deploy 
do
    sleep 2
done

npx prisma generate
