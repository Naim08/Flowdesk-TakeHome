import request from 'supertest';
import app from '../../app';
import { clearFetchOrderbookInterval } from '../../services/orderbook.service';
import { binanceWS } from '../../services/exchanges/binance/binance.service';

describe('Integration Test: Global Price', () => {

  afterAll(async () => {
    binanceWS.close();
    clearFetchOrderbookInterval();
  })

  test('/price route should return 200 for BTCUSDT', async () => {
    const response = await request(app).get('/price/BTCUSDT');
    expect(response.status).toBe(200);
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('/price route should return 200 for ETHUSDT', async () => {
    const response = await request(app).get('/price/ETHUSDT');
    expect(response.status).toBe(200);
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('/price route should return 400 error for INVALID', async () => {
    const response = await request(app).get('/price/INVALID');
    expect(response.status).toBe(400);
  });
});