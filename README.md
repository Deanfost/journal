# journal
A simple journalling REST API.

## API Docs
This server hosts API docs, courtesy of Swagger UI and Swagger-JSDoc. To access the documentation, start the server and go to [localhost:5050/docs](http://localhost:5050/docs). 

## Backend
To set up the Express backend, run `npm i` in `/express`, and follow the steps in the following section. To start the Express backend on localhost:5050, run `npm start`. 

### Env Vars Setup
All environments vars referenced in the `docker-compose.yaml` and throughout express with `process.env` should be specified in a root-level (outside of `/express`) `.env` file. Environment variables:
- `POSTGRES_USER`- initialize the Postgres container's user account
- `POSTGRES_PASSWORD` - initialize the Postgres container's password
- `POSTGRES_URI` - useful for connecting to the container with the PSQL shell (not required)
- `JWT_SECRET` - used to sign JWTs
- `JWT_DELTA_MINUTES` - set JWT expiration delta

Notes: 
- Changing the first two Postgres env vars will require the container to be re-created (`docker compose down` then `docker compose up` again)
- Example URI where POSTGRES_USER=main and POSTGRES_PASSWORD=aabbccdd1: 'postgresql://main:aabbccdd1@localhost:5432/db'

### DB Management Commands
Within the `/express` dir:

- Delete data and (re)install schemas: `npm run init_db`
- Seed sample data: `npm run seed_db` 

Note: the seed command will not reset auto-incrementing columns

## Serving a Frontend
The backend is capable of serving a production build of a frontend. To serve it, modify the `express.static()` call in `express/app.js` to point to your production build folder. In addition, ensure that `res.render()` within `/express/routes/index.js` points to the entry point of your build (check your framework's documentation). It will then be served on localhost:5050/.

## Starting Up the Postgres Container
Ensure that Docker and Docker Compose are installed on your machine. Run `docker compose up` in the root of the project to start the container on localhost:5432.

On first start, run the first db management command above to initialize the db.

## Tests
To test the backend, run `npm test` within `/express`. All tests take place on db "db_test".
