// src/services/exchanges/huobi/huobi.service.ts
import WebSocket from 'ws';
import { logger } from '../../../utils/logger';
import { memoryStore } from '../../../config/memorystore';
import Orderbook from '../../../models/orderbook.model';
import { calculateMidPrice } from '../../../utils/calculator';
import { Mutex } from 'async-mutex';
import config from '../../../config/config';

const HUOBI_WS_URL = 'wss://api.huobi.pro/ws';

interface HuobiWSMessage {
  ping?: number;
  ch?: string;
  ts?: number;
  tick?: {
    bids: number[][];
    asks: number[][];
    ts: number;
    version: number;
  };
}

class HuobiWebSocket {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private mutex = new Mutex();
  private pairs: string[] = [];
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(pairs: string[]) {
    this.pairs = pairs;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(config.exchanges.huobi.wsUrl || HUOBI_WS_URL);

    this.ws.on('open', () => {
      logger.info('Huobi WebSocket connected');
      this.subscribeToPairs();
      this.setupHeartbeat();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(data);
    });

    this.ws.on('close', (code, reason) => {
      logger.warn(`Huobi WebSocket closed: ${code} - ${reason}`);
      this.cleanup();
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      logger.error('Huobi WebSocket error:', error);
    });
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.ws?.ping();
    }, 30000);
  }

  private async handleMessage(data: WebSocket.Data) {
    try {
      const message: HuobiWSMessage = JSON.parse(
        Buffer.from(data as ArrayBuffer).toString()
      );

      if (message.ping) {
        this.handlePing(message.ping);
        return;
      }

      if (message.ch && message.tick) {
        await this.processOrderBookUpdate(message);
      }
    } catch (error) {
      logger.error('Error processing Huobi message:', error);
    }
  }

  private handlePing(pingId: number) {
    this.ws?.send(JSON.stringify({ pong: pingId }));
  }

  private async processOrderBookUpdate(message: HuobiWSMessage) {
    const release = await this.mutex.acquire();
    try {
      const match = message.ch?.match(/market\.(.*?)\.depth\./);
      if (!match || !message.tick) return;

      const pair = match[1].toUpperCase().replace('_', '');
      const bestBid = message.tick.bids[0][0];
      const bestAsk = message.tick.asks[0][0];

      const orderbook: Orderbook = {
        pair,
        exchange: 'huobi',
        bid: bestBid,
        ask: bestAsk,
        mid: calculateMidPrice(bestBid, bestAsk),
        timestamp: Date.now()
      };

      await memoryStore.set(`huobi-${pair}`, orderbook);
    } finally {
      release();
    }
  }

  private subscribeToPairs() {
    this.pairs.forEach(pair => {
      const huobiPair = pair.toLowerCase().replace('usdt', '_usdt');
      const subscription = {
        sub: `market.${huobiPair}.depth.step0`,
        id: Date.now().toString()
      };
      this.ws?.send(JSON.stringify(subscription));
    });
  }

  private scheduleReconnect() {
    setTimeout(() => {
      logger.info('Attempting Huobi WebSocket reconnection...');
      this.connect();
    }, this.reconnectInterval);
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  public updatePairs(newPairs: string[]) {
    this.pairs = newPairs;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.subscribeToPairs();
    }
  }

  public close() {
    this.cleanup();
    this.ws?.close();
  }
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export let huobiWS: HuobiWebSocket;

export const initializeHuobiWebSocket = (pairs: string[] = ['BTCUSDT']) => {
  huobiWS = new HuobiWebSocket(pairs);
};