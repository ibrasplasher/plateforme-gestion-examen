FROM node:16
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "start"]
#Installer MySQL Client dans le backend
RUN apt-get update && apt-get install -y default-mysql-client