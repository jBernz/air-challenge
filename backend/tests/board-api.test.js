const request = require('supertest');
const { Pool } = require('pg');
const { expect, beforeAll, afterAll, beforeEach, describe, test } = require('@jest/globals');
const path = require('path');

// Mock the actual server to avoid port conflicts during testing
jest.mock('http', () => {
  const originalModule = jest.requireActual('http');
  return {
    ...originalModule,
    createServer: jest.fn(() => ({
      listen: jest.fn(),
    })),
  };
});

// Mock Socket.IO to avoid actual socket connections
jest.mock('socket.io', () => {
  return {
    Server: jest.fn(() => ({
      on: jest.fn(),
      emit: jest.fn(),
    })),
  };
});

// Import the Express app (not the server)
let app;

// Setup test database connection
const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boards_test',
});

// Setup and teardown
beforeAll(async () => {
  // Override the pool in the app with our test pool
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boards_test';
  process.env.NODE_ENV = 'test';
  
  // Clear require cache to ensure fresh import with updated env vars
  jest.resetModules();
  
  // Use the compiled JavaScript version instead of trying to require the TS file directly
  // This assumes you've compiled your TypeScript to JavaScript
  const appPath = path.resolve(__dirname, '../dist/index.js');
  const appModule = require(appPath);
  app = appModule.default || appModule.app || appModule;
  
  // Initialize test database
  await testPool.query(`
    DROP TABLE IF EXISTS boards CASCADE;
    CREATE TABLE boards (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      parent_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

afterAll(async () => {
  await testPool.query('DROP TABLE IF EXISTS boards CASCADE');
  await testPool.end();
});

beforeEach(async () => {
  // Clear the boards table before each test
  await testPool.query('TRUNCATE boards RESTART IDENTITY CASCADE');
});

describe('Board API Integration Tests', () => {
  // Test 1: Create a board
  test('should create a new board', async () => {
    const response = await request(app)
      .post('/api/boards')
      .send({ name: 'Test Board' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Board');
    expect(response.body.parent_id).toBeNull();
  });

  // Test 2: Create a child board
  test('should create a child board', async () => {
    // First create a parent board
    const parentResponse = await request(app)
      .post('/api/boards')
      .send({ name: 'Parent Board' });
    
    const parentId = parentResponse.body.id;
    
    // Then create a child board
    const childResponse = await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Child Board', 
        parent_id: parentId 
      });
    
    expect(childResponse.status).toBe(201);
    expect(childResponse.body.name).toBe('Child Board');
    expect(childResponse.body.parent_id).toBe(parentId);
  });

  // Test 3: Fail to create a board with non-existent parent
  test('should fail to create a board with non-existent parent', async () => {
    const response = await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Orphan Board', 
        parent_id: 999 // Non-existent parent ID
      });
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Parent board not found');
  });

  // Test 4: Delete a board
  test('should delete a board', async () => {
    // Create a board to delete
    const createResponse = await request(app)
      .post('/api/boards')
      .send({ name: 'Board to Delete' });
    
    const boardId = createResponse.body.id;
    
    // Delete the board
    const deleteResponse = await request(app)
      .delete(`/api/boards/${boardId}`);
    
    expect(deleteResponse.status).toBe(200);
    
    // Verify the board is deleted
    const getResponse = await request(app)
      .get(`/api/boards/${boardId}`);
    
    expect(getResponse.status).toBe(404);
  });

  // Test 5: Cascade deletion of child boards
  test('should cascade delete child boards', async () => {
    // Create parent board
    const parentResponse = await request(app)
      .post('/api/boards')
      .send({ name: 'Parent for Cascade' });
    
    const parentId = parentResponse.body.id;
    
    // Create child board
    const childResponse = await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Child for Cascade', 
        parent_id: parentId 
      });
    
    const childId = childResponse.body.id;
    
    // Delete parent board
    await request(app)
      .delete(`/api/boards/${parentId}`);
    
    // Verify child board is also deleted
    const getChildResponse = await request(app)
      .get(`/api/boards/${childId}`);
    
    expect(getChildResponse.status).toBe(404);
  });

  // Test 6: Move a board to a new parent
  test('should move a board to a new parent', async () => {
    // Create two parent boards
    const parent1Response = await request(app)
      .post('/api/boards')
      .send({ name: 'Original Parent' });
    
    const parent2Response = await request(app)
      .post('/api/boards')
      .send({ name: 'New Parent' });
    
    // Create child under parent1
    const childResponse = await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Child to Move', 
        parent_id: parent1Response.body.id 
      });
    
    const childId = childResponse.body.id;
    
    // Move child to parent2
    const moveResponse = await request(app)
      .put(`/api/boards/${childId}/move`)
      .send({ new_parent_id: parent2Response.body.id });
    
    expect(moveResponse.status).toBe(200);
    expect(moveResponse.body.parent_id).toBe(parent2Response.body.id);
  });

  // Test 7: Prevent circular references when moving boards
  test('should prevent circular references when moving boards', async () => {
    // Create parent board
    const parentResponse = await request(app)
      .post('/api/boards')
      .send({ name: 'Parent Board' });
    
    // Create child board
    const childResponse = await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Child Board', 
        parent_id: parentResponse.body.id 
      });
    
    // Try to move parent under child (should fail)
    const moveResponse = await request(app)
      .put(`/api/boards/${parentResponse.body.id}/move`)
      .send({ new_parent_id: childResponse.body.id });
    
    expect(moveResponse.status).toBe(400);
    expect(moveResponse.body.error).toContain('Cannot move a board to its descendant');
  });

  // Test 8: Enforce maximum board depth
  test('should enforce maximum board depth of 10', async () => {
    // Create a chain of 10 nested boards
    let currentParentId = null;
    
    for (let i = 1; i <= 10; i++) {
      const response = await request(app)
        .post('/api/boards')
        .send({ 
          name: `Level ${i} Board`, 
          parent_id: currentParentId 
        });
      
      expect(response.status).toBe(201);
      currentParentId = response.body.id;
    }
    
    // Try to create an 11th level (should fail)
    const tooDeepResponse = await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Too Deep Board', 
        parent_id: currentParentId 
      });
    
    expect(tooDeepResponse.status).toBe(400);
    expect(tooDeepResponse.body.error).toContain('Maximum board depth (10) exceeded');
  });

  // Test 9: Get hierarchical board structure
  test('should return boards in hierarchical structure', async () => {
    // Create parent board
    const parentResponse = await request(app)
      .post('/api/boards')
      .send({ name: 'Parent Board' });
    
    const parentId = parentResponse.body.id;
    
    // Create two child boards
    await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Child Board 1', 
        parent_id: parentId 
      });
    
    await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Child Board 2', 
        parent_id: parentId 
      });
    
    // Get all boards
    const getResponse = await request(app)
      .get('/api/boards');
    
    expect(getResponse.status).toBe(200);
    
    // Find the parent board in the response
    const parentBoard = getResponse.body.find(board => board.id === parentId);
    
    // Verify parent has two children
    expect(parentBoard).toBeDefined();
    expect(parentBoard.children).toHaveLength(2);
    expect(parentBoard.children[0].name).toContain('Child Board');
    expect(parentBoard.children[1].name).toContain('Child Board');
  });

  // Test 10: Get a specific board with its children
  test('should get a specific board with its children', async () => {
    // Create parent board
    const parentResponse = await request(app)
      .post('/api/boards')
      .send({ name: 'Specific Parent' });
    
    const parentId = parentResponse.body.id;
    
    // Create child board
    await request(app)
      .post('/api/boards')
      .send({ 
        name: 'Specific Child', 
        parent_id: parentId 
      });
    
    // Get the specific board
    const getResponse = await request(app)
      .get(`/api/boards/${parentId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(parentId);
    expect(getResponse.body.children).toHaveLength(1);
    expect(getResponse.body.children[0].name).toBe('Specific Child');
  });
});