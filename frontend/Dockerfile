# Use an official Node.js runtime as a parent image
FROM node:18.18-alpine3.18

# Set the working directory
# WORKDIR /frontend
WORKDIR /app/frontend

COPY package.json package-lock.json* ./

RUN npm install

# Copy the Next.js project into the container
COPY . .

# Build the Next.js app
# RUN npm run build

# Expose the port your Next.js app runs on
EXPOSE 3000

# Start the Next.js app
CMD ["npm","run","dev"]