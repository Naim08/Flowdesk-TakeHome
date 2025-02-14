import { fetchOrderbookHuobiRest } from '../../services/exchanges/huobi/huobi.service';
import { huobiWS, initializeHuobiWebSocket } from '../../services/exchanges/huobi/huobiWS.service';
import { memoryStore} from '../../config/memorystore';

describe('Unit Test: Huobi Service', () => {

  beforeAll(() => {
    initializeHuobiWebSocket(['BTCUSDT']);
  });
  
  let exchange = 'huobi';


  test('fetchOrderbookHuobi with missing pair', async () => {
    const pair = '';
    huobiWS.updatePairs([]);
    const orderbook = await  memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });


  test('fetchOrderbookHuobi with invalid trading pair', async () => {
    const pair = 'INVALID';
    huobiWS.updatePairs([pair]);
    const orderbook = await  memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook).toBe(undefined);
  });

});
