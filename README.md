# journal
A simple journalling REST API.

All environments vars referenced in the `docker-compose.yaml` and throughout express with `process.env` should be specified in a root-level `.env` file.

## Starting the Backend
To set up the Express backend, run `npm i` in `/express`. To start the Express backend on localhost:5000, run `npm start`.

### DB Management Commands
Within the `/express` dir:

- Delete data and (re)install schemas: `npm run init_db`
- Seed sample data: `npm run seed_db` 

Note: the seed command will not reset auto-incrementing columns

## Serving a Frontend
The backend is capable of serving a production build of a frontend. To serve it, modify the `express.static()` call in `express/app.js` to point to your production build folder. In addition, ensure that `res.render()` within `/express/routes/index.js` points to the entry point of your build (check your framework's documentation). It will then be served on `localhost:5000/`.

## Starting Up the Postgres Container
Ensure that Docker and Docker Compose are installed on your machine. Run `docker compose up` in the root of the project to start the container on localhost:5432.

## Tests
The backend includes both load test and unit test suites. 

### Unit Tests
To test the backend, run `npm test` within `/express`. All tests take place on db "db_test".

### Load Tests (for fun)
Load testing utilizes the Artillery package. First install artillery globally with `npm i -g artillery`. Then run a test suite in `/express/test` with `artillery run path/to/script.yml`. 

