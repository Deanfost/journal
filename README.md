# journal
A simple journalling web app.

All environments vars referenced in the `docker-compose.yaml` and throughout express with `process.env` should be specified in a root-level `.env` file.

## Starting the Backend
To set up the Express backend, run `npm i` in `/express`. To start the Express backend on localhost:5000, run `npm start`.

### DB Management Commands
Within the `/express` dir:

- Delete data and (re)install schemas: `npm run init_db`
- Seed sample data: `npm run seed_db` 

Note: the seed command will not reset auto-incrementing columns

## Starting the React app
To set up the React app, run `npm i` in `/react-app`.

To start the React development server on localhost:3000, run `npm start` in `/react-app`. The backend serves a production build of the react app. To update the production build, run `npm run build` in `/react-app`, and restart the backend.

## Starting Up the Postgres Container
Ensure that Docker and Docker Compose are installed on your machine. Run `docker compose up` in the root of the project to start the container on localhost:5432.

## Tests
To test the backend, run `npm test` within `/express`. All tests take place on db "db_test".

