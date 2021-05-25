FROM node:13

COPY http-server.js .
RUN npm init -y
RUN npm install express
EXPOSE 8080

CMD ["node", "http-server.js"]