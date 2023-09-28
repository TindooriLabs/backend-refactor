FROM node:lts-alpine3.16

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps 

COPY . .

CMD ["npm", "run", "start"]

