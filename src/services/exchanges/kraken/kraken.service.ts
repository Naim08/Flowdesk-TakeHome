// src/services/exchanges/kraken/kraken.service.ts

import axios from "axios";
import WebSocket from "ws";
import { logger } from "../../../utils/logger";
import Orderbook from "../../../models/orderbook.model";
import { unsetValue, setValue } from "../../../config/memorystore";
import { calculateAverage } from "../../../utils/calculator";

/**
 * Existing REST response interface
 */
interface Depth {
  error: [];
  result: { [key: string]: Tick };
}

interface Tick {
  asks: number[][];
  bids: number[][];
}

/**
 * For WebSocket, the format for "book" subscription typically
 * looks like: [ channelID, { as: [...], bs: [...], a: [...], b: [...] }, "book-5", "XBT/USD" ] 
 * We'll parse just enough for best bid/ask in the snippet below.
 */
type KrakenWSMessage = any; // For advanced usage, define a stricter type

/**
 * Config object for Kraken
 */
const config = {
  name: "kraken",
  restUrl: "https://api.kraken.com/0/public/Depth",
  wsUrl: "wss://ws.kraken.com", // or wss://ws.kraken.com/v2
  depth: 5,
};

/**
 * Variables to hold WebSocket instance and connection state
 */
let ws: WebSocket | null = null;
let isWsConnected = false;

/**
 * Closes the active Kraken WebSocket, if open
 */
export const closeKrakenWebsocket = (): void => {
  if (ws) {
    try {
      ws.close();
      logger.info("Closed existing Kraken WebSocket.");
    } catch (error) {
      logger.error("Error closing Kraken WebSocket:", error);
    } finally {
      ws = null;
      isWsConnected = false;
    }
  }
};

/**
 * Initialize a WebSocket connection to Kraken and subscribe
 * to the orderbook for the given pairs, each with a certain depth.
 *
 * For example: initKrakenWebsocket(["BTC/USD", "ETH/USD"])
 *
 * NOTE: Kraken uses pairs like "XBT/USD", "ETH/USD" etc.
 * The pairs *must* match Kraken’s naming convention or you'll get no data.
 */
export const initKrakenWebsocket = async (pairs: string[]): Promise<void> => {
  if (!pairs.length) {
    logger.warn("No pairs provided to initKrakenWebsocket. Aborting.");
    return;
  }

  // If there's an existing connection, close it and re-init
  if (ws) {
    closeKrakenWebsocket();
  }

  logger.info(`Connecting Kraken WebSocket -> ${config.wsUrl}`);
  ws = new WebSocket(config.wsUrl);

  ws.on("open", () => {
    isWsConnected = true;
    logger.info(`Kraken WebSocket connected. Subscribing to pairs: [${pairs.join(", ")}]`);

    // Example subscription message for book data
    // For advanced usage or partial updates, see: https://docs.kraken.com/websockets/
    const subscriptionMsg = {
      method: "subscribe",
      // Some newer Kraken docs require the 'params' key vs old "subscription"
      params: {
        subscription: {
          name: "book",
          depth: config.depth,
        },
        pair: pairs,
      },
      reqid: 1,
    };

    // Send subscription request
    ws?.send(JSON.stringify(subscriptionMsg));
  });

  // If there's an error, we'll set isWsConnected to false
  ws.on("error", (error: any) => {
    logger.error("Kraken WebSocket error:", error);
    isWsConnected = false;
  });

  // If the WS closes, also mark it disconnected
  ws.on("close", () => {
    logger.warn("Kraken WebSocket closed.");
    isWsConnected = false;
    ws = null;
  });

  // Listen for messages
  ws.on("message", async (raw: string) => {
    try {
      const msg: KrakenWSMessage = JSON.parse(raw);

      // Subscription status or heartbeat messages won't be arrays
      // The orderbook messages generally come as an array:
      // [ channelID, { as: [...], bs: [...], ... }, "book-5", "XBT/USD" ]
      if (Array.isArray(msg) && msg.length > 1) {
        const channelData = msg[1];
        // The pair is typically at msg[3], e.g. "XBT/USD"
        const pair = msg[3] || "";

        // The initial snapshot might be in "as" / "bs"
        if (channelData.as && channelData.bs) {
          const asks = channelData.as; // e.g. [["22000.0", "1.2345", "1675000000"], ...]
          const bids = channelData.bs; // same shape

          if (asks.length > 0 && bids.length > 0) {
            // We’ll parse best ask & best bid
            const bestAsk = Math.min(...asks.map((ask: [string, string, string]) => parseFloat(ask[0])));
            const bestBid = Math.max(...bids.map((bid: [string, string, string]) => parseFloat(bid[0])));
            const midPrice = calculateAverage([bestAsk, bestBid]);

            // e.g. "kraken-XBT/USD"
            const key = `${config.name}-${pair.toUpperCase().replace("/", "")}`;

            // Clean old record, just in case
            await unsetValue(key);

            const orderbook: Orderbook = {
              pair: pair.toUpperCase(),
              exchange: config.name,
              bid: bestBid,
              ask: bestAsk,
              mid: midPrice,
              timestamp: Date.now(),
            };

            await setValue(key, orderbook);
            logger.info(`[WS] Updated ${config.name} orderbook for ${pair}`, orderbook);
          }
        } 
        else if (channelData.a || channelData.b) {
          // This is a partial update
          // Real production code would maintain a local snapshot, 
          // apply partial updates, then recalc best bid/ask. 
          // For brevity, we skip that logic here.
        }
      }
    } catch (err) {
      logger.error("Error parsing Kraken WebSocket message:", err);
    }
  });
};

/**
 * Fallback REST fetch for a single trading pair.
 * For example: fetchOrderbookKrakenRest("XBTUSD") or "BTC/USD"
 *
 * This tries to align with Kraken’s REST depth endpoint.
 */
export const fetchOrderbookKrakenRest = async (pair: string): Promise<void> => {
  if (!pair) return;

  // Kraken REST expects something like "XBTUSD"
  // If you track "BTC/USD", you might map to "XBTUSD" here.
  const symbol = pair.toUpperCase().replace("/", "");

  try {
    const response = await axios.get<Depth>(config.restUrl, {
      params: {
        pair: symbol,
        count: config.depth,
      },
    });

    // If something went wrong or the exchange returned an error array
    if (response.status !== 200 || (response.data.error && response.data.error.length > 0)) {
      logger.warn(`Kraken REST error for pair ${symbol}: ${response.data.error}`);
      return;
    }

    const data = response.data;
    if (!data.result || Object.keys(data.result).length === 0) {
      logger.warn(`Kraken REST returned no result for pair ${symbol}.`);
      return;
    }

    // The first key in result is typically the symbol with some prefix
    const resultKey = Object.keys(data.result)[0];
    const asks = data.result[resultKey].asks;
    const bids = data.result[resultKey].bids;

    if (!asks?.length || !bids?.length) {
      logger.warn(`No asks/bids found in Kraken REST for pair ${symbol}.`);
      return;
    }

    const bestAsk = Math.min(...asks.map((ask) => Number(ask[0])));
    const bestBid = Math.max(...bids.map((bid) => Number(bid[0])));
    const midPrice = calculateAverage([bestAsk, bestBid]);

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
    logger.info(`[REST] Updated Kraken orderbook for ${symbol}`, orderbook);
  } catch (error) {
    logger.error(`catch fetchOrderbookKrakenRest(${pair}): ${error}`);
  }
};

/**
 * Main function you call externally to ensure the orderbook for `pair` is updated.
 * 
 * - If the WS is connected, we do nothing (the data is updated in real-time).
 * - If the WS is NOT connected, we fetch via REST.
 */
export const fetchOrderbookKraken = async (pair: string): Promise<void> => {
  // If WS is up, skip REST (live streaming).
  if (isWsConnected) {
    return;
  }

  // Otherwise, fallback to REST
  await fetchOrderbookKrakenRest(pair);
};
