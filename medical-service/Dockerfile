FROM node:20-alpine
WORKDIR /usr/local/apps/medical-service
COPY package.json ./
COPY tsconfig.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force
COPY src ./src
EXPOSE 5002
CMD ["npm", "start"]
