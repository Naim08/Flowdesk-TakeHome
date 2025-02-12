import {MathUtils} from "../utils/calculator";
import { memoryStore } from "../config/memorystore";
import Orderbook from "../models/orderbook.model";
import PriceInterface from "./price.interface";
import { fetchOrderbookHuobi } from "./exchanges/huobi/huobi.service";
import { fetchOrderbookKraken } from "./exchanges/kraken/kraken.service";
import { fetchOrderbookBinance } from "./exchanges/binance";

const DEFAULT_TRADING_PAIR = "BTCUSDT";
let fetchOrderbookInterval: NodeJS.Timeout | null = null;

/**
 * Check if a trading pair exists in the stored values.
 */
export const tradingPairExists = async (pair: string): Promise<boolean> => {
  const tradingPairs: string[] = await memoryStore.get("tradingpair") || [];
  return tradingPairs.includes(pair);
};

/**
 * Add a new trading pair if it does not already exist.
 */
export const addTradingPair = async (pair: string): Promise<void> => {
  const tradingPairs: string[] = (await memoryStore.get("tradingpair")) || [];
  if (!tradingPairs.includes(pair)) {
    tradingPairs.push(pair);
    await memoryStore.set("tradingpair", tradingPairs);
    await fetchOrderbook();
  }
};

/**
 * Fetch the global price index from different exchanges and calculate an average.
 */
export const getGlobalPriceIndex = async (pair: string): Promise<PriceInterface> => {
  const exchanges = ["huobi", "kraken", "binance"];
  const prices: number[] = [];
  const exchangeData: Record<string, number> = {};

  for (const exchange of exchanges) {
    const orderbook: Orderbook | null = await memoryStore.get(`${exchange}-${pair}`);
    if (orderbook !== null) {
      // Use the orderbook
    }
    if (orderbook?.mid) {
      prices.push(orderbook.mid);
      exchangeData[exchange] = orderbook.mid;
    }
  }

  return {
    price: MathUtils.calculateAverage(prices),
    pair,
    exchanges: exchangeData,
  };
};

/**
 * Clear the interval that fetches order books.
 */
export const clearFetchOrderbookInterval = (): void => {
  if (fetchOrderbookInterval) {
    clearInterval(fetchOrderbookInterval);
    fetchOrderbookInterval = null;
  }
};

/**
 * Fetch order book data from all exchanges for active trading pairs.
 */
export const fetchOrderbook = async (): Promise<void> => {
  let tradingPairs: string[] = (await memoryStore.get("tradingpair")) || [DEFAULT_TRADING_PAIR];
  await memoryStore.set("tradingpair", tradingPairs);

  clearFetchOrderbookInterval();
  await fetchOrderbookBinance(tradingPairs); // Start Binance WebSocket first

  for (const pair of tradingPairs) {
    await Promise.all([
      fetchOrderbookKraken(pair),
      fetchOrderbookHuobi(pair),
    ]);
  }

  fetchOrderbookInterval = setInterval(async () => {
    for (const pair of tradingPairs) {
      await Promise.all([
        fetchOrderbookKraken(pair),
        fetchOrderbookHuobi(pair),
      ]);
    }
  }, 6000);
};
