FROM node:16
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5000
RUN apt-get update && apt-get install -y default-mysql-client
CMD ["npm", "start"]
