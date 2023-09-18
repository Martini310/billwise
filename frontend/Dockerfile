# Use an official Node.js runtime as a parent image
FROM node:slim

# Set the working directory
WORKDIR /app

# Install vim
RUN ["apt-get", "update"]
RUN ["apt-get", "-y", "install", "vim"]

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the Next.js project into the container
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port your Next.js app runs on
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]