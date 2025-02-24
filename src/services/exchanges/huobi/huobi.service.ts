import axios from "axios";
import WebSocket from "ws";
import { inflate } from "pako";  // <-- import pako
import { logger } from "../../../utils/logger";
import Orderbook from "../../../models/orderbook.model";
import { unsetValue, setValue } from "../../../config/memorystore";
import { calculateAverage } from "../../../utils/calculator";

interface Depth {
  ch: string;
  status: string;
  tick: Tick;
  ts: number;
}

interface Tick {
  asks: number[][];
  bids: number[][];
  ts: number;
  version: number;
}

const config = {
  name: "huobi",
  restUrl: "https://api.huobi.pro/market/depth",
  wsUrl: "wss://api.huobi.pro/ws",
  depth: 5, // Used for REST ("step0" is used in WS subscription)
};

// Track our WebSocket & connection state
let ws: WebSocket | null = null;
let isWsConnected = false;

/**
 * Close the active Huobi WebSocket connection, if open.
 */
export const closeHuobiWebsocket = (): void => {
  if (ws) {
    try {
      ws.close();
      logger.info("Closed existing Huobi WebSocket.");
    } catch (error) {
      logger.error("Error closing Huobi WebSocket:", error);
    } finally {
      ws = null;
      isWsConnected = false;
    }
  }
};

/**
 * Initialize a Huobi WebSocket connection for the given trading pairs.
 *
 * Example usage:
 *   initHuobiWebsocket(["btcusdt", "ethusdt"]);
 *
 * Note: Huobi typically expects lowercase pairs like "btcusdt".
 * If your aggregator uses "BTCUSDT", convert it to "btcusdt".
 */
export const initHuobiWebsocket = async (pairs: string[]): Promise<void> => {
  if (!pairs.length) {
    logger.warn("No pairs provided to initHuobiWebsocket. Aborting.");
    return;
  }

  // If there's an existing connection, close it
  if (ws) {
    closeHuobiWebsocket();
  }

  logger.info(`Connecting Huobi WebSocket -> ${config.wsUrl}`);
  ws = new WebSocket(config.wsUrl);

  ws.on("open", () => {
    isWsConnected = true;
    logger.info(`Huobi WebSocket connected. Subscribing to pairs: [${pairs.join(", ")}]`);

    // Subscribe to each pair's "market.{pair}.depth.step0"
    pairs.forEach((pair) => {
      const normalized = pair.toLowerCase(); // e.g. "btcusdt"
      const subMsg = {
        sub: `market.${normalized}.depth.step0`,
        id: `sub-${normalized}`,
      };
      ws?.send(JSON.stringify(subMsg));
    });
  });

  ws.on("error", (error: any) => {
    logger.error("Huobi WebSocket error:", error);
    isWsConnected = false;
  });

  ws.on("close", () => {
    logger.warn("Huobi WebSocket closed.");
    isWsConnected = false;
    ws = null;
  });

  // Listen for compressed messages
  ws.on("message", async (raw: Buffer) => {
    try {
      // 1) Decompress gzipped data
      const decompressed = inflate(raw, { to: "string" });

      // 2) Parse JSON
      const msg = JSON.parse(decompressed);

      // 3) Huobi ping message => respond with pong
      if (msg.ping) {
        const pong = { pong: msg.ping };
        ws?.send(JSON.stringify(pong));
        return;
      }

      // 4) Check if we have an orderbook snapshot: "tick" => bids/asks
      if (msg.tick && msg.tick.bids && msg.tick.asks) {
        const { bids, asks } = msg.tick;

        if (bids.length > 0 && asks.length > 0) {
          const bestBid = Math.max(...bids.map((bid: number[]) => bid[0]));
          const bestAsk = Math.min(...asks.map((ask: number[]) => ask[0]));
          const mid = calculateAverage([bestBid, bestAsk]);

          // Extract pair from "ch", e.g. "market.btcusdt.depth.step0"
          const channel = msg.ch || "";
          let symbol = channel.split(".")[1] || "UNKNOWN";
          symbol = symbol.toUpperCase(); // e.g. "BTCUSDT"

          const key = `${config.name}-${symbol}`;
          await unsetValue(key);

          const orderbook: Orderbook = {
            pair: symbol,
            exchange: config.name,
            bid: bestBid,
            ask: bestAsk,
            mid,
            timestamp: Date.now(),
          };

          await setValue(key, orderbook);
          logger.info(`[WS] Updated Huobi orderbook for ${symbol}`, orderbook);
        }
      }

      // Additional subscription status messages may appear (e.g. "subbed", "status")
      // We'll ignore them here unless you want to parse them specifically.
    } catch (err) {
      logger.error("Error parsing Huobi WebSocket message:", err);
    }
  });
};

/**
 * Fallback REST fetch for a single trading pair, e.g. "btcusdt"
 * If your aggregator uses uppercase "BTCUSDT", convert to lower here.
 */
export const fetchOrderbookHuobiRest = async (pair: string): Promise<void> => {
  if (!pair) {
    return;
  }

  pair = pair.toLowerCase();

  try {
    const response = await axios.get<Depth>(config.restUrl, {
      params: {
        symbol: pair,
        depth: config.depth,
        type: "step0",
      },
    });

    if (response.status !== 200 || response.data.status === "error") {
      logger.warn(`Huobi REST error for ${pair}:`, response.data);
      return;
    }

    const data = response.data;
    const bestAsk = Math.min(...data.tick.asks.map((ask) => ask[0]));
    const bestBid = Math.max(...data.tick.bids.map((bid) => bid[0]));
    const midPrice = calculateAverage([bestAsk, bestBid]);

    const symbol = pair.toUpperCase();
    const key = `${config.name}-${symbol}`;
    await unsetValue(key);

    const orderbook: Orderbook = {
      ask: bestAsk,
      bid: bestBid,
      mid: midPrice,
      pair: symbol,
      exchange: config.name,
      timestamp: Date.now(),
    };

    await setValue(key, orderbook);
    logger.info(`[REST] Updated Huobi orderbook for ${symbol}`, orderbook);
  } catch (error) {
    logger.error(`fetchOrderbookHuobi: ${error}`);
  }
};

/**
 * Main function you call externally to ensure a given pair's orderbook is updated.
 * 
 * - If the WebSocket is connected, do nothing (live data).
 * - Otherwise, fetch from REST.
 */
export const fetchOrderbookHuobi = async (pair: string): Promise<void> => {
  if (isWsConnected) {
    // If WS is alive, data is real-time. No need for REST here.
    return;
  }
  // Fallback to REST if WS is not connected
  await fetchOrderbookHuobiRest(pair);
};

