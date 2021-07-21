# Select base image
FROM node:10

# Select work directory
WORKDIR /TwilioPhoneBurner

# Copy dependancies
COPY /package.json ./

# Copy project into current folder
COPY . /TwilioPhoneBurner

# Install dependancies
RUN npm install

# Expose port
EXPOSE 3001

# start server
CMD ["npm", "start"]