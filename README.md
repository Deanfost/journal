# journal
A simple journalling web app.

All environments vars referenced in the `docker-compose.yaml` and throughout express with `process.env` should be specified in a root-level `.env` file.

## Starting the Backend
To set up the Express backend, run `npm i` in `/express`. To start the Express backend on localhost:5000, run `npm start`.

## Starting the React app
To set up the React app, run `npm i` in `/react-app`.

To start the React development server on localhost:3000, run `npm start` in `/react-app`. The backend serves a production build of the react app. To update the production build, run `npm run build` in `/react-app`, and restart the backend.

## Setting Up the Postgres Container
Ensure that Docker and Docker Compose are installed on your machine. Run `docker compose up` in the root of the project to start the container on localhost:5432. To format the database, use `npm run init_db` from the `/express` directory while the container is running.

## Tests
To test the backend, run `npm test` within `/express`.

## Useful Tools
- The `sequelize-cli` package can be installed globally using `npm i -g sequelize-cli`, which provides a lot of tools for interacting with the Sequelize library: https://github.com/sequelize/cli.

