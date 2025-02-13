import logger from '../../../utils/logger';
import { huobiWS, initializeHuobiWebSocket } from './huobiWS.service';
import { fetchOrderbookHuobiRest  } from './huobi.service';

/**
 * Ensures Huobi WebSocket is running and listening to the given pairs.
 * If the WebSocket isn’t connected, fall back to the REST API.
 */

export const fetchOrderbookHuobi = async (pairs: string[]): Promise<void> => {
  if (huobiWS && huobiWS.isConnected()) {
    huobiWS.updatePairs(pairs);
  } else {
    logger.warn('Huobi WebSocket not connected, falling back to REST API.');
    for (const pair of pairs) {
      await fetchOrderbookHuobiRest(pair);
    }
  }
};