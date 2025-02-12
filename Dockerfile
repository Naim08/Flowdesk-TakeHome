# Install system dependencies
FROM node:18.18-alpine 
WORKDIR /app

# Install nodejs dependencies
COPY package.json ./
RUN npm install

# Copy and generate the static html
COPY . .
RUN npm run test && npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"] 
