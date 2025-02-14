import { checkTradingPair, fetchOrderbookBinance, closeBinanceWebsocket } from '../../services/exchanges/binance/binance.service';
import { getValue, setValue } from '../../config/memorystore';

describe('Unit Test: Binance Service', () => {

  let exchange = 'binance';


  test('fetchOrderbookBinance with missing pair', async () => {
    const pair = '';
    await fetchOrderbookBinance(pair);
    const orderbook = await getValue(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });

  test('checkTradingPair with valid trading pair', async () => {
    const pair = 'BTCUSDT';
    const result = await checkTradingPair(pair);
    expect(result).toBe(true);
  });

  test('checkTradingPair with invalid trading pair', async () => {
    const pair = 'INVALID';
    const result = await checkTradingPair(pair);
    expect(result).toBe(false);
  });


  test('fetchOrderbookBinance with valid trading pairs', async () => {
    const pairs = ['BTCUSDT', 'ETHUSDT'];
    for (let pair of pairs) {
      await fetchOrderbookBinance(pair);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    const orderbookOne = await getValue(`${exchange}-${pairs[0]}`);
    expect(orderbookOne.pair).toBe(pairs[0]);
    expect(orderbookOne.exchange).toBe(exchange);
    expect(orderbookOne.ask).toBeGreaterThan(0);
    expect(orderbookOne.bid).toBeGreaterThan(0);
    expect(orderbookOne.mid).toBeGreaterThan(0);


    const orderbookTwo = await getValue(`${exchange}-${pairs[1]}`);
    expect(orderbookTwo.pair).toBe(pairs[1]);
    expect(orderbookTwo.exchange).toBe(exchange);
    expect(orderbookTwo.ask).toBeGreaterThan(0);
    expect(orderbookTwo.bid).toBeGreaterThan(0);
    expect(orderbookTwo.mid).toBeGreaterThan(0);
  }, 10000);

  test('fetchOrderbookBinance with invalid trading pair', async () => {
    const pairs = ['INVALIDONE', 'INVALIDTWO'];
    for (let pair of pairs) {
      await fetchOrderbookBinance(pair);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    const orderbookOne = await getValue(`${exchange}-${pairs[0]}`);
    expect(orderbookOne).toBe(undefined);

    const orderbookTwo = await getValue(`${exchange}-${pairs[1]}`);
    expect(orderbookTwo).toBe(undefined);
  }, 10000);

});
