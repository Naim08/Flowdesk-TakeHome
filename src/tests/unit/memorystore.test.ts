import { setValue, getValue } from '../../config/memorystore';

describe('Unit Test: Memory Store', () => {

  test('setValue and getValue with key and value', async () => {
    setValue('tradingpair', ['BTCUSDT']);
    const tradingpair = await getValue('tradingpair');
    expect(tradingpair).toContain('BTCUSDT');
  });

})