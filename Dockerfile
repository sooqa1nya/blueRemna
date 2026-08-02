FROM node:26-alpine3.23

ENV TZ="Europe/Moscow"

WORKDIR /home/project
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]