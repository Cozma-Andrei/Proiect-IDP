FROM node:20-alpine
WORKDIR /usr/local/apps/records-service
COPY package.json ./
COPY tsconfig.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force
COPY src ./src
EXPOSE 5003
CMD ["npm", "start"]
