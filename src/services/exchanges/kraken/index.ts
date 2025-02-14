// src/services/exchanges/kraken/kraken.service.ts
import { krakenWS, initializeKrakenWebSocket } from './krakenStream.service';
import { fetchOrderbookKraken as fetchOrderbookKrakenRest } from './kraken.service';
import {logger} from '../../../utils/logger';

/**
 * Ensures Kraken WebSocket is running and listening to the given pairs.
 * If the WebSocket isn’t connected, fall back to the REST API.
 */
export const fetchOrderbookKraken = async (pairs: string[]): Promise<void> => {
  if (krakenWS && krakenWS.isConnected()) {
    krakenWS.updatePairs(pairs);
  } else {
    logger.warn('Kraken WebSocket not connected, falling back to REST API.');
    for (const pair of pairs) {
      await fetchOrderbookKrakenRest(pair);
    }
  }
};
