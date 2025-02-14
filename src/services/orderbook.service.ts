import { calculateAverage } from "../utils/calculator";
import { getValue, setValue } from "../config/memorystore";

import Orderbook from '../models/orderbook.model'
import PriceInterface from './price.interface'
import { fetchOrderbookHuobi } from "./exchanges/huobi/huobi.service";
import { fetchOrderbookKraken } from "./exchanges/kraken/kraken.service";
import { fetchOrderbookBinance } from "./exchanges/binance/binance.service";

export const tradingpairExists = async (newpair: string): Promise<boolean> => {
  let foundPair: boolean = false;
  await getValue('tradingpair').then((tradingpair: string[]) => {
    if (tradingpair !== undefined && tradingpair.indexOf(newpair) >= 0) {
      foundPair = true;
    }
  });
  return foundPair;
}

export const addTradingPair = async (newtradingpair: string): Promise<void> => {
  if (await tradingpairExists(newtradingpair)) {
    return;
  }
  await getValue('tradingpair').then((tradingpair: string[]) => {

    if (tradingpair == undefined || tradingpair.length == 0) {
      tradingpair = [newtradingpair];
    } else {
      if (tradingpair.indexOf(newtradingpair) == -1) {
        tradingpair.push(newtradingpair);
      }
    }

    setValue('tradingpair', tradingpair);
  });
  await fetchOrderbook();
}

export const getGlobalPriceIndex = async (tradingpair: string): Promise<PriceInterface> => {

  let globalPrice: number = 0;

  let exchangePrice: number[] = [];
  const huobiOrderbook: Orderbook = await getValue(`huobi-${tradingpair}`);

  if (huobiOrderbook !== undefined && huobiOrderbook.mid !== undefined && huobiOrderbook.mid > 0) {
    exchangePrice.push(huobiOrderbook.mid);
  }

  const krakenOrderbook: Orderbook = await getValue(`kraken-${tradingpair}`);
  if (krakenOrderbook !== undefined && krakenOrderbook.mid !== undefined && krakenOrderbook.mid > 0) {
    exchangePrice.push(krakenOrderbook.mid);
  }

  const binanceOrderbook: Orderbook = await getValue(`binance-${tradingpair}`);
  if (binanceOrderbook !== undefined && binanceOrderbook.mid !== undefined && binanceOrderbook.mid > 0) {
    exchangePrice.push(binanceOrderbook.mid);
  }

  globalPrice = calculateAverage(exchangePrice);

  const result: PriceInterface = {
    price: globalPrice,
    pair: tradingpair,
    exchanges: {
      binance: binanceOrderbook?.mid,
      kraken: krakenOrderbook?.mid,
      huobi: huobiOrderbook?.mid,
    }
  };

  return result;

};

export let fetchOrderbookInterval: any;
export const clearFetchOrderbookInterval = () => {
  clearInterval(fetchOrderbookInterval);
}

export const fetchOrderbook = async (): Promise<void> => {

  let tradingPairs: string[] = []
  await getValue('tradingpair').then((tradingpair: string[]) => {
    if (tradingpair == undefined || tradingpair.length == 0) {
      tradingPairs = ["BTCUSDT"];
    } else {
      tradingPairs = tradingpair;
    }
  });
  await setValue('tradingpair', tradingPairs);

  clearFetchOrderbookInterval();
  ///await fetchOrderbookBinance(tradingPairs); //websockets get run first

  for (let i = 0; i < tradingPairs.length; i++) {
    await fetchOrderbookBinance(tradingPairs[i]);
    await fetchOrderbookKraken(tradingPairs[i]);
    await fetchOrderbookHuobi(tradingPairs[i]);
  }

  fetchOrderbookInterval = setInterval(async () => {
    // rest api calls get run here periodically(every 3 seconds)
    for (let i = 0; i < tradingPairs.length; i++) {
      await fetchOrderbookKraken(tradingPairs[i]);
      await fetchOrderbookHuobi(tradingPairs[i]);
    }
  }, 6000);
};