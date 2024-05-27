FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Add this line to print the contents of the dist directory
RUN ls -la /usr/src/app/dist


CMD ["npm", "run", "start:prod"]
