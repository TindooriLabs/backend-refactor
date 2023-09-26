FROM node:lts-alpine3.16

WORKDIR /usr/app

COPY package.json .
COPY package-lock.json .

RUN npm ci --legacy-peer-deps

COPY . .

ENTRYPOINT [ "npm", "run", "docker-serve" ]