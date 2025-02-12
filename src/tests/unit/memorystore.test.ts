import { memoryStore } from '../../config/memorystore';

describe('Unit Test: Memory Store', () => {

  test('set and get with key and value', async () => {
    memoryStore.set('tradingpair', ['BTCUSDT']);
    const tradingpair = await  memoryStore.get('tradingpair');
    expect(tradingpair).toContain('BTCUSDT');
  });

})