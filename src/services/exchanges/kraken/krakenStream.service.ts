import WebSocket from 'ws';
import logger from '../../../utils/logger';
import config from '../../../config/config';
import Orderbook from '../../../models/orderbook.model';
import { memoryStore } from '../../../config/memorystore';
import { MathUtils } from '../../../utils/calculator';

// The Kraken WebSocket URL and depth are obtained from your config
class KrakenWebSocket {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private pairs: string[] = [];
  private maxReconnectInterval = 60000; // max interval of 60 seconds

  constructor(pairs: string[]) {
    this.pairs = pairs;
    this.connect();
  }

  private connect() {
    const wsUrl = config.exchanges.kraken.wsUrl;
    logger.info(`Connecting to Kraken WebSocket at ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      logger.info('Kraken WebSocket connected');
      // Reset the reconnect interval on a successful connection
      this.reconnectInterval = 5000;
      this.subscribeToPairs();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(data);
    });

    this.ws.on('close', (code, reason) => {
      logger.warn(`Kraken WebSocket closed: ${code} - ${reason}`);
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      logger.error('Kraken WebSocket error:', error);
    });
  }

  private subscribeToPairs() {
    // Kraken allows subscribing to multiple pairs in one message.
    // The subscription request includes the "book" feed with the desired depth.
    const subMsg = {
      event: 'subscribe',
      pair: this.pairs,
      subscription: {
        name: 'book',
        depth: config.exchanges.kraken.depth
      }
    };
    logger.info(`Subscribing to Kraken pairs: ${JSON.stringify(this.pairs)}`);
    this.ws?.send(JSON.stringify(subMsg));
  }

  private handleMessage(data: WebSocket.Data) {
    try {
      let message: any;
      if (typeof data === 'string') {
        message = JSON.parse(data);
      } else if (data instanceof Buffer) {
        message = JSON.parse(data.toString());
      } else {
        // Fallback for other binary data types
        message = JSON.parse(data.toString());
      }

      // Kraken messages can be either an object (event/status) or an array (data update)
      if (Array.isArray(message)) {
        // Expected order book update format:
        // [channelID, { as: [...], bs: [...] }, "book-{depth}", "PAIR"]
        const channelData = message[1];
        const pair = message[3];
        if (channelData) {
          // Use snapshot arrays ("as" for asks, "bs" for bids) if available,
          // or update arrays ("a" and "b") otherwise.
          let asks: number[][] = [];
          let bids: number[][] = [];

          if (channelData.as && Array.isArray(channelData.as)) {
            asks = channelData.as;
          } else if (channelData.a && Array.isArray(channelData.a)) {
            asks = channelData.a;
          }

          if (channelData.bs && Array.isArray(channelData.bs)) {
            bids = channelData.bs;
          } else if (channelData.b && Array.isArray(channelData.b)) {
            bids = channelData.b;
          }

          if (asks.length > 0 && bids.length > 0) {
            const bestAsk = Math.min(...asks.map((ask) => Number(ask[0])));
            const bestBid = Math.max(...bids.map((bid) => Number(bid[0])));            
            const orderbook: Orderbook = {
              pair: pair.toUpperCase(),
              exchange: 'kraken',
              bid: bestBid,
              ask: bestAsk,
              mid: MathUtils.calculateAverage([bestAsk, bestBid]),
              timestamp: Date.now()
            };
            memoryStore.set(`kraken-${pair.toUpperCase()}`, orderbook);
          }
        }
      } else if (message.event) {
        // Handle event messages such as subscription status or heartbeat.
        if (message.event === 'heartbeat') {
          logger.info('Kraken heartbeat received');
        } else if (message.event === 'subscriptionStatus') {
          logger.info(`Kraken subscription status: ${JSON.stringify(message)}`);
        } else {
          logger.info(`Kraken event message: ${JSON.stringify(message)}`);
        }
      }
    } catch (error) {
      logger.error('Error processing Kraken WebSocket message:', error);
    }
  }

  private scheduleReconnect() {
    setTimeout(() => {
      logger.info('Attempting Kraken WebSocket reconnection...');
      this.connect();
      // Increase the interval for subsequent attempts (exponential backoff)
      this.reconnectInterval = Math.min(this.reconnectInterval * 2, this.maxReconnectInterval);
    }, this.reconnectInterval);
  }

  public updatePairs(newPairs: string[]) {
    this.pairs = newPairs;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.subscribeToPairs();
    }
  }

  public close() {
    this.ws?.close();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export let krakenWS: KrakenWebSocket;

/**
 * Initializes the Kraken WebSocket for the given trading pairs.
 */
export const initializeKrakenWebSocket = (pairs: string[]) => {
  krakenWS = new KrakenWebSocket(pairs);
};

/**
 * Helper function to ensure the Kraken WebSocket is running and subscribing
 * to the provided pairs. If not connected, it initializes the connection.
 */
