import { addTradingPair, fetchOrderbook, getGlobalPriceIndex } from '../../services/orderbook.service';
import { getValue } from '../../config/memorystore';
import Orderbook from '../../models/orderbook.model';
import { clearFetchOrderbookInterval, tradingpairExists } from '../../services/orderbook.service';
import { closeBinanceWebsocket } from '../../services/exchanges/binance/binance.service';
import { closeKrakenWebsocket } from '../../services/exchanges/kraken/kraken.service';
import { closeHuobiWebsocket } from '../../services/exchanges/huobi/huobi.service';

describe('Unit Test: Orderbook Service', () => {

  beforeAll(async () => {
    await fetchOrderbook();
  })
  afterAll(async () => {
    clearFetchOrderbookInterval();
    closeBinanceWebsocket();
    closeKrakenWebsocket();
    closeHuobiWebsocket();
  })

  test('tradingpairExists with BTCUSDT', async () => {
    const pair = 'BTCUSDT';
    const result = await tradingpairExists(pair);
    expect(result).toBe(true);
  });



  test('fetchOrderbook with BTCUSDT', async () => {

    await new Promise(resolve => setTimeout(resolve, 5000));

    const pair = 'BTCUSDT';
    const huobiKey = `huobi-${pair}`
    const krakenKey = `kraken-${pair}`
    const binanceKey = `binance-${pair}`

    const huobiOrderbook: Orderbook = await getValue(huobiKey);
    const krakenOrderbook: Orderbook = await getValue(krakenKey);
    const binanceOrderbook: Orderbook = await getValue(binanceKey);

    expect(huobiOrderbook).not.toBe(undefined);
    expect(huobiOrderbook.pair).toBe(pair);
    expect(huobiOrderbook.exchange).toBe('huobi');
    expect(huobiOrderbook.mid).toBeGreaterThan(0);

    expect(krakenOrderbook).not.toBe(undefined);
    expect(krakenOrderbook.pair).toBe(pair);
    expect(krakenOrderbook.exchange).toBe('kraken');
    expect(krakenOrderbook.mid).toBeGreaterThan(0);

    expect(binanceOrderbook).not.toBe(undefined);
    expect(binanceOrderbook.pair).toBe(pair);
    expect(binanceOrderbook.exchange).toBe('binance');
    expect(binanceOrderbook.mid).toBeGreaterThan(0);

  }, 15000)

  test('addTradingPair with ETHUSDT', async () => {
    const pair = 'ETHUSDT';

    await addTradingPair(pair);
    await new Promise(resolve => setTimeout(resolve, 5000));

    const huobiKey = `huobi-${pair}`
    const krakenKey = `kraken-${pair}`
    const binanceKey = `binance-${pair}`

    const huobiOrderbook: Orderbook = await getValue(huobiKey);
    const krakenOrderbook: Orderbook = await getValue(krakenKey);
    const binanceOrderbook: Orderbook = await getValue(binanceKey);

    expect(huobiOrderbook).not.toBe(undefined);
    expect(huobiOrderbook.pair).toBe(pair);
    expect(huobiOrderbook.exchange).toBe('huobi');
    expect(huobiOrderbook.mid).toBeGreaterThan(0);

    expect(krakenOrderbook).not.toBe(undefined);
    expect(krakenOrderbook.pair).toBe(pair);
    expect(krakenOrderbook.exchange).toBe('kraken');
    expect(krakenOrderbook.mid).toBeGreaterThan(0);


    expect(binanceOrderbook).not.toBe(undefined);
    expect(binanceOrderbook.pair).toBe(pair);
    expect(binanceOrderbook.exchange).toBe('binance');
    expect(binanceOrderbook.mid).toBeGreaterThan(0);

  }, 15000)

  test('addTradingPair with invalid trading pair', async () => {
    const pair = 'INVALID';
    await addTradingPair(pair);
    await new Promise(resolve => setTimeout(resolve, 5000));


    const huobiKey = `huobi-${pair}`
    const krakenKey = `kraken-${pair}`
    const binanceKey = `binance-${pair}`

    const huobiOrderbook: Orderbook = await getValue(huobiKey);
    const krakenOrderbook: Orderbook = await getValue(krakenKey);
    const binanceOrderbook: Orderbook = await getValue(binanceKey);

    expect(huobiOrderbook).toBe(undefined);

    expect(krakenOrderbook).toBe(undefined);

    expect(binanceOrderbook).toBe(undefined);

  }, 15000);


  test('getGlobalPriceIndex with BTCUSDT', async () => {
    await new Promise(resolve => setTimeout(resolve, 4000));
    const result = await getGlobalPriceIndex("BTCUSDT");
    expect(result.pair).toBe("BTCUSDT");
    expect(result.price).toBeGreaterThan(0);
  })

})