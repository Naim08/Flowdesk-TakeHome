// src/services/exchanges/binance/binance.service.ts
import WebSocket from 'ws';
import logger  from '../../../utils/logger';
import config from '../../../config/config';
import Orderbook from '../../../models/orderbook.model';
import { memoryStore } from '../../../config/memorystore';
import { calculateMidPrice } from '../../../utils/calculator';

class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private pairs: string[] = [];
  private maxReconnectInterval = 60000; // max interval of 60 seconds

  constructor(pairs: string[]) {
    this.pairs = pairs;
    this.connect();
  }

  private connect() {
    const wsUrl = `${config.exchanges.binance.wsUrl}`;
    logger.info(`Connecting to Binance WebSocket at ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      logger.info('Binance WebSocket connected');
      this.reconnectInterval = 5000;
      this.subscribeToPairs();
    });

    this.ws.on('message', (data: string) => {
      this.handleMessage(data);
    });

    this.ws.on('close', (code, reason) => {
      logger.warn(`Binance WebSocket closed: ${code} - ${reason}`);
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      logger.error('Binance WebSocket error:', error);
    });
  }

  private subscribeToPairs() {
    const streams = this.pairs.map(pair => 
      `${pair.toLowerCase()}@depth${config.exchanges.binance.depth}@100ms`
    );
    logger.info(`Subscribing to streams: ${JSON.stringify(streams)}`);
    this.ws?.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now()
    }));
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      if (message.stream?.endsWith('@depth')) {
        const pair = message.data.s.toUpperCase();
        const bestBid = parseFloat(message.data.b[0][0]);
        const bestAsk = parseFloat(message.data.a[0][0]);
        
        const orderbook: Orderbook = {
          pair,
          exchange: 'binance',
          bid: bestBid,
          ask: bestAsk,
          mid: calculateMidPrice(bestBid, bestAsk),
          timestamp: Date.now()
        };

        memoryStore.set(`binance-${pair}`, orderbook);
      }
    } catch (error) {
      logger.error('Error processing Binance WebSocket message:', error);
    }
  }

  private scheduleReconnect() {
    setTimeout(() => {
      logger.info('Attempting Binance WebSocket reconnection...');
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

  // New method to check the connection state
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export let binanceWS: BinanceWebSocket;

export const initializeBinanceWebSocket = (pairs: string[]) => {
  binanceWS = new BinanceWebSocket(pairs);
};
