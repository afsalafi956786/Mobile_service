# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY server/package*.json ./ 

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY server . 

# Expose the port the app runs on
EXPOSE 5000 

# Start the application
CMD ["node", "index.js"]
