FROM node:20-alpine

WORKDIR /usr/local/apps/myapp

COPY package.json ./
COPY tsconfig.json ./

RUN npm install && npm cache clean --force

COPY src ./src
# COPY .env ./

EXPOSE 3000

CMD ["npm", "start"]
