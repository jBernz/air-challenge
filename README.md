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
