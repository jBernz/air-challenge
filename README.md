# Justin's Air Fullstack Challenge

This is a full-stack TypeScript application allowing for the creation, deletion, and movement of nested boards.

## Development

### Development with Docker

```bash
# Start the development environment
docker compose -f docker-compose.dev.yml up --build

# Stop the development environment
docker compose -f docker-compose.dev.yml down
```

The development environment includes:

- Hot reloading for both frontend and backend
- Volume mounts for real-time code changes
- Development-specific configurations
- Isolated node_modules for each service

**Note about Package Management:** When adding new packages to either frontend or backend, you'll need to rebuild the Docker containers:

```bash
# 1. Stop the containers
docker compose -f docker-compose.dev.yml down

# 2. Rebuild and start the containers
docker compose -f docker-compose.dev.yml up --build
```

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Tests

```bash
cd backend
npm run test
```

## Environment Variables

### Backend

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode
- `DATABASE_URL`: Postgres database
- `TEST_DATABASE_URL`: Test Postgres Database

### Frontend

- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL
- `PORT`: Frontend port (default: 3000)

### Note from the candidate

Hello!

This is my Air fullstack challenge.

** **I have made updates to fix things like broken test config, and the original upload had a line of code that prevented the backend from running properly. Please feel free to evaluate the initial commit for the code I wrote within the 4 hours!** **

In the past when I have done these challenges where I have significant moving parts and technologies integrated
I have run into time issues caused by errors getting the pieces to work together. For that reason, this time I took a holistic approach, using v0 to generate much of the application, then drilling down into the specifics manually.

For the backend I used the provided Express and added Postgres as a DB. For the frontend I used React Query 
and the provided Next code. Additionally I used the provided WebSocket hook to invalidate the React Query cache in case of an update from the server. It is expected you can create, move, delete boards up to 10 levels deep without worrying about circular dependencies.

I used Jest to write the required integration tests for the backend routes.

Much of my initial time was spent working through bugs bugs caused by AI hallucination such as type and configuration issues. After spending several hours to polish up, I'm satisfied to leave it here. If I were to continue working, some things I would do are:

- Add drag and drop for board movement

- Make board creation form position specific

- Add frontend integration tests

- Remove AI artifacts and extraneous logic

- Get Tests working with Docker, and add a test env

- Add an error State when nesting too deep

Please let me know if you have any questions, or if I can provide anything to help you evaluate!

Justin
