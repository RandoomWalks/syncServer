FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./


RUN npm install
RUN npm install bson

COPY . .
COPY .env ./

RUN npm run build

# Add this line to print the contents of the dist directory
RUN ls -la /usr/src/app/dist


CMD ["npm", "run", "start:prod"]
