FROM node:lts-alpine3.16

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]
COPY prisma ./prisma/

ARG GOOGLE_TRANSLATE_API_KEY
ENV GOOGLE_TRANSLATE_API_KEY ${GOOGLE_TRANSLATE_API_KEY}

ARG JWT_SECRET
ENV JWT_SECRET =${JWT_SECRET}

RUN npm ci --legacy-peer-deps 

COPY . .

CMD ["npm", "run", "start"]


