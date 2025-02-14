import { fetchOrderbookKraken } from '../../services/exchanges/kraken/kraken.service';
import {  memoryStore } from '../../config/memorystore';
import { initializeKrakenWebSocket } from '../../services/exchanges/kraken/krakenStream.service';

describe('Unit Test: Kraken Service', () => {
  beforeAll(() => {
    initializeKrakenWebSocket(['BTCUSDT']);
  });

  let exchange = 'kraken';

  test('fetchOrderbookKraken with missing pair', async () => {
    const pair = '';
    await fetchOrderbookKraken(pair);
    const orderbook = await  memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });

  test('fetchOrderbookKraken with invalid trading pair', async () => {
    const pair = 'INVALID';
    await fetchOrderbookKraken(pair);
    const orderbook = await memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });

});
