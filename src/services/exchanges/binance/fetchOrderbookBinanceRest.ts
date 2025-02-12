// src/services/exchanges/binance/binanceRest.service.ts
import axios from 'axios';
import config from '../../../config/config';
import Orderbook from '../../../models/orderbook.model';
import { memoryStore } from '../../../config/memorystore';
import { calculateMidPrice } from '../../../utils/calculator';
import logger from '../../../utils/logger';

export const fetchOrderbookBinanceRest = async (pair: string): Promise<void> => {
  try {
    const symbol = pair.toUpperCase();
    const url = `${config.exchanges.binance.restUrl}?symbol=${symbol}&limit=${config.exchanges.binance.depth}`;
    logger.info(`Fetching Binance REST orderbook for ${symbol} from ${url}`);
    
    const response = await axios.get(url);
    const data = response.data;

    if (data && data.bids && data.asks && data.bids.length && data.asks.length) {
      const bestBid = parseFloat(data.bids[0][0]);
      const bestAsk = parseFloat(data.asks[0][0]);
      
      const orderbook: Orderbook = {
        pair: symbol,
        exchange: 'binance',
        bid: bestBid,
        ask: bestAsk,
        mid: calculateMidPrice(bestBid, bestAsk),
        timestamp: Date.now()
      };

      memoryStore.set(`binance-${symbol}`, orderbook);
      logger.info(`Updated Binance REST orderbook for ${symbol}`);
    } else {
      logger.warn(`Binance REST API returned incomplete data for ${symbol}`);
    }
  } catch (error) {
    logger.error(`Error fetching Binance orderbook via REST for ${pair}:`, error);
  }
};
