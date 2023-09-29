FROM node:lts-alpine3.16

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps 

COPY . .

ENV JWT_SECRET=test

CMD ["npm", "run", "start"]


