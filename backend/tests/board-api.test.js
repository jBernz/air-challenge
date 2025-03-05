const request = require('supertest');
const { pool, resetDatabase, closeDatabase } = require('./setup');
const { expect } = require('@jest/globals');

// Import the Express app
const app = require('../src/index');

// Setup and teardown
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('Board Depth and Cascade Tests', () => {
  // Test maximum depth constraint
  describe('Maximum Board Depth', () => {
    test('should enforce maximum board depth of 10', async () => {
      // Create a chain of 10 boards (reaching the max depth)
      let parentId = null;
      let boardIds = [];
      
      for (let i = 1; i <= 10; i++) {
        const response = await request(app)
          .post('/api/boards')
          .send({ name: `Board Level ${i}`, parent_id: parentId });
        
        expect(response.status).toBe(201);
        parentId = response.body.id;
        boardIds.push(parentId);
      }
      
      // Try to create an 11th board (exceeding max depth)
      const exceedResponse = await request(app)
        .post('/api/boards')
        .send({ name: 'Exceed Depth Board', parent_id: parentId });
      
      expect(exceedResponse.status).toBe(400);
      expect(exceedResponse.body.error).toContain('Maximum board depth');
    });

    test('should prevent moving a board if it would exceed maximum depth', async () => {
      // Create a chain of 5 boards
      let chain1ParentId = null;
      let chain1BoardIds = [];
      
      for (let i = 1; i <= 5; i++) {
        const response = await request(app)
          .post('/api/boards')
          .send({ name: `Chain 1 Level ${i}`, parent_id: chain1ParentId });
        
        chain1ParentId = response.body.id;
        chain1BoardIds.push(chain1ParentId);
      }
      
      // Create another chain of 6 boards
      let chain2ParentId = null;
      let chain2BoardIds = [];
      
      for (let i = 1; i <= 6; i++) {
        const response = await request(app)
          .post('/api/boards')
          .send({ name: `Chain 2 Level ${i}`, parent_id: chain2ParentId });
        
        chain2ParentId = response.body.id;
        chain2BoardIds.push(chain2ParentId);
      }
      
      // Try to move the top of chain 1 under the bottom of chain 2
      // This would create a depth of 5 + 6 = 11, exceeding the max of 10
      const moveResponse = await request(app)
        .put(`/api/boards/${chain1BoardIds[0]}/move`)
        .send({ new_parent_id: chain2BoardIds[chain2BoardIds.length - 1] });
      
      expect(moveResponse.status).toBe(400);
      expect(moveResponse.body.error).toContain('exceed maximum depth');
    });
  });

  // Test cascading deletion
  describe('Cascading Deletion', () => {
    test('should delete all child boards when parent is deleted', async () => {
      // Create a parent board
      const parentResponse = await request(app)
        .post('/api/boards')
        .send({ name: 'Parent Board' });
      
      const parentId = parentResponse.body.id;
      
      // Create multiple child boards
      const childIds = [];
      for (let i = 1; i <= 3; i++) {
        const response = await request(app)
          .post('/api/boards')
          .send({ name: `Child Board ${i}`, parent_id: parentId });
        
        childIds.push(response.body.id);
      }
      
      // Create grandchild boards
      const grandchildIds = [];
      for (let i = 0; i < childIds.length; i++) {
        const response = await request(app)
          .post('/api/boards')
          .send({ name: `Grandchild Board ${i+1}`, parent_id: childIds[i] });
        
        grandchildIds.push(response.body.id);
      }
      
      // Delete the parent board
      const deleteResponse = await request(app).delete(`/api/boards/${parentId}`);
      expect(deleteResponse.status).toBe(200);
      
      // Verify all children and grandchildren are deleted
      for (const id of [...childIds, ...grandchildIds]) {
        const response = await request(app).get(`/api/boards/${id}`);
        expect(response.status).toBe(404);
      }
      
      // Verify the boards list is empty
      const listResponse = await request(app).get('/api/boards');
      expect(listResponse.body.length).toBe(0);
    });

    test('should verify database-level cascade deletion', async () => {
      // Create a parent board
      const parentResponse = await request(app)
        .post('/api/boards')
        .send({ name: 'Parent Board' });
      
      const parentId = parentResponse.body.id;
      
      // Create a child board
      const childResponse = await request(app)
        .post('/api/boards')
        .send({ name: 'Child Board', parent_id: parentId });
      
      const childId = childResponse.body.id;
      
      // Delete the parent directly from the database
      await pool.query('DELETE FROM boards WHERE id = $1', [parentId]);
      
      // Verify child is deleted via API
      const response = await request(app).get(`/api/boards/${childId}`);
      expect(response.status).toBe(404);
    });
  });

  // Test circular reference prevention
  describe('Circular Reference Prevention', () => {
    test('should prevent creating circular references when moving boards', async () => {
      // Create a hierarchy: Root -> Child -> Grandchild
      const rootResponse = await request(app)
        .post('/api/boards')
        .send({ name: 'Root Board' });
      
      const rootId = rootResponse.body.id;
      
      const childResponse = await request(app)
        .post('/api/boards')
        .send({ name: 'Child Board', parent_id: rootId });
      
      const childId = childResponse.body.id;
      
      const grandchildResponse = await request(app)
        .post('/api/boards')
        .send({ name: 'Grandchild Board', parent_id: childId });
      
      const grandchildId = grandchildResponse.body.id;
      
      // Try to move Root under Grandchild (would create a cycle)
      const moveResponse = await request(app)
        .put(`/api/boards/${rootId}/move`)
        .send({ new_parent_id: grandchildId });
      
      expect(moveResponse.status).toBe(400);
      expect(moveResponse.body.error).toContain('Cannot move a board to its descendant');
    });
  });
});

console.log('Depth and cascade tests loaded');