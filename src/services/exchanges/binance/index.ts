// src/services/exchanges/binance/binance.service.ts
import { binanceWS, initializeBinanceWebSocket } from './binance.service';
import { fetchOrderbookBinanceRest } from './fetchOrderbookBinanceRest';
import logger from '../../../utils/logger';

/**
 * Ensures Binance WebSocket is running and listening to the given pairs.
 * If the WebSocket isn’t connected, fall back to the REST API.
 */
export const fetchOrderbookBinance = async (pairs: string[]): Promise<void> => {
  if (binanceWS && binanceWS.isConnected()) {
    binanceWS.updatePairs(pairs);
  } else {
    logger.warn('Binance WebSocket not connected, falling back to REST API.');
    for (const pair of pairs) {
      await fetchOrderbookBinanceRest(pair);
    }
  }
};
