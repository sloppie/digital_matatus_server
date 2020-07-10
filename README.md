# DIGITAL MATATUS SERVER

# Introduction
This is the server that acts as the request handler for the DigitalMatatus app.

# Setup

## Installing Requirements

### Environment Requirements
* NodeJS runtime
* MongoDB database

### Installing NodeJS
Follow the instructions for installing NodeJS on your specific platform from the <a href="https://nodejs.org/en/download/">NodeJS website</a>

### Installing MongoDB
Follow the procedure for installing the MongoDB data base <a href="https://docs.mongodb.com/guides/server/install/#procedure">here</a>

## Setting up the server

### Creating the database
1. Open a `mongo` shell (run `mongo` on the terminal)
2. Run the following commands: 
```mongo
  use digital_matatus
  db.createCollection("user")
  db.createCollection("report")
  db.createCollection("routes")
```

### Complete the setup
1. `cd` into the root directory where the server is contained
2. run the following command `node index`
3. perform a `GET` request to the `'/api/routes'` route of the server to finish set up

### Run the server
1. Run `node index` in the root directory of the server
