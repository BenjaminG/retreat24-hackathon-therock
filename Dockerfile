# Dockerfile
FROM node:20
WORKDIR /app

# Install dotenvx
RUN curl -fsS https://dotenvx.sh/ | sh

COPY package*.json ./
RUN npm install

# Build the app
RUN npm run build

COPY . .
EXPOSE 3000

# Prepend dotenvx run
CMD ["dotenvx", "run", "--", "node", "dist/app.js"]