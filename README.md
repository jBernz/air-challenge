# Express Next.js WebSocket Demo with TypeScript

This is a full-stack TypeScript application demonstrating the integration of Express.js backend with Next.js frontend, featuring REST API and WebSocket communication.

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

**I have made updates to fix things like broken test config, and the original upload had a line of code that prevented the backend from running properly. Please feel free to evaluate the initial commit for the code I wrote within the 4 hours!**

In the past when I have done these challenges where I have significant moving parts and technologies integrated
I have run into errors getting the pieces to work together. For that reason, this time I took a holistic approach,
using v0 to generate much of the application.

I have not made an app with this many moving pieces with v0 before, and I will say I still ran into plenty of those 
kinds of roadblocks. That said, writing the actual functionality and business logic went far faster.

For the backend I used the provided Express and added Postgres as a DB. For the frontend I used React Query 
and the provided Next code. I was able to get all the routes working, and the frontend functionally using all the routes.

I used Jest to write some integration tests for the backend routes.

I expect to be able to see the required functionality running the backend and frontend locally, 
and the tests to run for the backend.

Much of my time was spent working through bugs with things like misaligned keys in data formatting, type mismatches children not rendering, and issues with Node and dependencies. If I were to continue working some things I would do are:

- Separate routes into their own files

- Add drag and drop to boards
 
- Add frontend tests

- Add frontend integration tests

- Remove AI artifacts and extraneous logic

- Get Docker working

Please let me know if you have any questions, or if I can provide anything to help you evaluate!

Justin
