FROM node:22-alpine

WORKDIR /app

# Copy package.json and install dependencies from checker directory
COPY ./checker/package*.json ./
RUN npm install

# Copy the checker script
COPY ./checker/index.js .

# Copy the user's node files from app directory for execution
COPY ./app/listener.js ./
COPY ./app/dialer.js ./

# Default command
CMD ["node", "index.js"]
