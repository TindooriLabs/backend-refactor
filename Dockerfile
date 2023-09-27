FROM node:lts-alpine3.16

WORKDIR /usr/app

COPY package.json .
COPY package-lock.json .

RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 3000

ENTRYPOINT [ "npm", "run", "docker-serve" ]