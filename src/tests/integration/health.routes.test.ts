import request from 'supertest';
import app from '../../app';

describe('Integration Test: Health', () => {
  test('/health route should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});