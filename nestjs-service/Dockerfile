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


# Set DNS servers
# RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf
# RUN echo "nameserver 1.1.1.1" >> /etc/resolv.conf

CMD ["npm", "run", "start:prod"]
