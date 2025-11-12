FROM node:25.1-alpine

WORKDIR /app
COPY app/package*.json ./
RUN npm install

COPY app/. .
RUN npm run build
RUN npm run prisma:generate
RUN npx prisma migrate deploy
EXPOSE 3000
CMD ["node", "app.js"]
