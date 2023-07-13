FROM node:14

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y \
    libc6 \
    curl \
    wget \
    nodejs

# upgrade node and npm to the newest version
RUN npm install -g npm@latest

# upgrade node to newest
RUN npm cache clean -f
RUN npm install -g n
RUN n latest
RUN npm install

COPY . .

ENV PORT=8080

EXPOSE 8080

EXPOSE 8081

CMD [ "npm", "start", "--no-warnings" ]