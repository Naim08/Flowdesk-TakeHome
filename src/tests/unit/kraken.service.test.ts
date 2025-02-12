import { fetchOrderbookKraken } from '../../services/exchanges/kraken/kraken.service';
import {  memoryStore } from '../../config/memorystore';

describe('Unit Test: Kraken Service', () => {

  let exchange = 'kraken';

  test('fetchOrderbookKraken with missing pair', async () => {
    const pair = '';
    await fetchOrderbookKraken(pair);
    const orderbook = await  memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });

  test('fetchOrderbookKraken with valid trading pair', async () => {
    const pair = 'BTCUSDT';
    await fetchOrderbookKraken(pair);
    const orderbook = await memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook.pair).toBe(pair);
    expect(orderbook.exchange).toBe(exchange);
    expect(orderbook.ask).toBeGreaterThan(0);
    expect(orderbook.bid).toBeGreaterThan(0);
    expect(orderbook.mid).toBeGreaterThan(0);
  });

  test('fetchOrderbookKraken with invalid trading pair', async () => {
    const pair = 'INVALID';
    await fetchOrderbookKraken(pair);
    const orderbook = await memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });

});
