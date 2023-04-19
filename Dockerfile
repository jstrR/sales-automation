FROM node:18.12.1
WORKDIR /app

COPY . .
RUN npm install

EXPOSE 8080

ENV PORT=8080

CMD ["npm", "start"]