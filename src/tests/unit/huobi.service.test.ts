import { fetchOrderbookHuobi } from '../../services/exchanges/huobi/huobi.service';
import { getValue, setValue } from '../../config/memorystore';

describe('Unit Test: Huobi Service', () => {

  let exchange = 'huobi';


  test('fetchOrderbookHuobi with missing pair', async () => {
    const pair = '';
    await fetchOrderbookHuobi(pair);
    const orderbook = await getValue(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });


  test('fetchOrderbookHuobi with valid trading pair', async () => {
    const pair = 'BTCUSDT';
    await fetchOrderbookHuobi(pair);
    const orderbook = await getValue(`${exchange}-${pair}`);
    expect(orderbook.pair).toBe(pair);
    expect(orderbook.exchange).toBe(exchange);
    expect(orderbook.ask).toBeGreaterThan(0);
    expect(orderbook.bid).toBeGreaterThan(0);
    expect(orderbook.mid).toBeGreaterThan(0);
  });

  test('fetchOrderbookHuobi with invalid trading pair', async () => {
    const pair = 'INVALID';
    await fetchOrderbookHuobi(pair);
    const orderbook = await getValue(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });

});
