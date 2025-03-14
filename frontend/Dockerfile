FROM node:16

WORKDIR /app

# Installer bash
RUN apt-get update && apt-get install -y bash

COPY package.json package-lock.json ./
RUN npm install

EXPOSE 3000

COPY . .

CMD ["npm", "start"]
