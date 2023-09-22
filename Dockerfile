FROM node:lts-alpine3.16

ADD package.json /app/
ADD package-lock.json /app/

WORKDIR /app

RUN npm ci

ADD . /app/


ENTRYPOINT [ "npm", "run", "docker-serve" ]