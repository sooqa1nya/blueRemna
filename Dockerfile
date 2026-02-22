FROM node:current-alpine3.22  

ENV TZ="Europe/Moscow"

WORKDIR /home/project
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]