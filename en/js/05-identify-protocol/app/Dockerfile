<<<<<<< HEAD
FROM node:20-alpine as build
WORKDIR /en/js/05-identify-protocol/app
=======
FROM node:22-alpine as build
WORKDIR /app
>>>>>>> 3e8cd0582c49d8b80a97adf71c17a085697b704f
COPY package*.json ./
RUN npm install
COPY . .

<<<<<<< HEAD
FROM node:20-alpine
WORKDIR /en/js/05-identify-protocol/app
COPY --from=build /en/js/05-identify-protocol/app /en/js/05-identify-protocol/app

# Set environment variables for timeout and log file
ARG TIMEOUT_DURATION=10s
ENV TIMEOUT_DURATION=${TIMEOUT_DURATION}
ARG LOG_FILE=/app/stdout.log
ENV LOG_FILE=${LOG_FILE}

CMD ["node", "index.js"] 
=======
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app /app

# Set environment variables for timeout and log file
ARG TIMEOUT_DURATION=30s
ENV TIMEOUT_DURATION=${TIMEOUT_DURATION}
ARG REMOTE_PEERS
ENV REMOTE_PEERS=${REMOTE_PEERS}

# Run with timeout and redirect output to mounted log file
CMD ["/bin/sh", "-c", "timeout ${TIMEOUT_DURATION} node index.js > /app/stdout.log 2>&1"]
>>>>>>> 3e8cd0582c49d8b80a97adf71c17a085697b704f
