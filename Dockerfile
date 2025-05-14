# Stage 1: build
FROM node:18-alpine 
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run typechain
# Start the application
CMD ["npm", "start"]
