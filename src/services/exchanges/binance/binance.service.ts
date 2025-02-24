import axios from "axios";
import WebSocket from "ws";
import { logger } from "../../../utils/logger";
import Orderbook from "../../../models/orderbook.model";
import { unsetValue, setValue } from "../../../config/memorystore";
import { calculateMidPrice } from "../../../utils/calculator";
import Data from "./binance.interface"; // { id, result, stream, data: { bids, asks } }

const config = {
  name: "binance",
  wsUrl: "wss://stream.binance.us:9443/stream?streams=",
  restApi: "https://api.binance.us/api/v3/depth",
  depth: 5,
};

let ws: WebSocket | null = null;
let isWsConnected = false;

/**
 * Optionally close the active Binance WebSocket, if open.
 */
export const closeBinanceWebsocket = (): void => {
  if (ws) {
    try {
      ws.close();
      logger.info("Closed existing Binance WebSocket.");
    } catch (error) {
      logger.error("Error closing Binance WebSocket:", error);
    } finally {
      ws = null;
      isWsConnected = false;
    }
  }
};

/**
 * Attempt to connect a Binance WebSocket for the given pairs.
 * Example pairs: ["BTCUSDT", "ETHUSDT"].
 *
 * This function is typically called once when your app starts,
 * or after you add new trading pairs. The WebSocket remains open
 * and provides real-time updates.
 *
 * If the connection fails, or is closed, `isWsConnected` will be set to false,
 * and the fallback REST approach can be used.
 */
export const initBinanceWebsocket = async (pairs: string[]): Promise<void> => {
  if (pairs.length === 0) {
    logger.warn("No pairs provided to initBinanceWebsocket. Aborting.");
    return;
  }

  // 1) If there's an existing WebSocket, close it (we'll re-init).
  if (ws) {
    closeBinanceWebsocket();
  }

  // 2) Build the multi-stream endpoint:
  //    e.g. "btcusdt@depth5@100ms/ethusdt@depth5@100ms"
  const streams = pairs
    .map((p) => `${p.toLowerCase()}@depth${config.depth}@100ms`)
    .join("/");

  const wsEndpoint = `${config.wsUrl}${streams}`;
  logger.info(`Connecting Binance WebSocket -> ${wsEndpoint}`);

  // 3) Create a new WebSocket
  ws = new WebSocket(wsEndpoint);

  // 4) Handle open
  ws.on("open", () => {
    isWsConnected = true;
    logger.info(`Binance WebSocket connected for pairs: [${pairs.join(", ")}]`);
  });

  // 5) Listen to messages => parse best bid/ask => store in memory
  ws.on("message", async (raw: string) => {
    try {
      const msg: Data = JSON.parse(raw);

      // The multi-stream format typically has: { stream: "...", data: { bids, asks } }
      if (msg?.data?.bids && msg?.data?.asks) {
        const { bids, asks } = msg.data;
        if (bids.length > 0 && asks.length > 0) {
          const bestBid = parseFloat(String(bids[0][0]));
          const bestAsk = parseFloat(String(asks[0][0]));
          const midPrice = calculateMidPrice(bestBid, bestAsk);

          // stream format is typically something like "btcusdt@depth5@100ms"
          // to extract the pair, split at '@'
          const streamId = msg.stream || "";
          const pair = streamId.split("@")[0]?.toUpperCase() || "UNKNOWN";
          const key = `${config.name}-${pair}`;

          // Optional: remove old record
          await unsetValue(key);

          const orderbook: Orderbook = {
            pair,
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
    } catch (error) {
      logger.error("Error parsing Binance WebSocket message:", error);
    }
  });

  // 6) Handle errors
  ws.on("error", (error: any) => {
    logger.error("Binance WebSocket error:", error);
    isWsConnected = false;
  });

  // 7) Handle close
  ws.on("close", () => {
    logger.warn("Binance WebSocket closed.");
    isWsConnected = false;
    ws = null;
  });
};


export const fetchOrderbookBinanceRest = async (pair: string): Promise<void> => {
  try {
    const symbol = pair.toUpperCase();
    const url = `${config.restApi}?symbol=${symbol}&limit=${config.depth}`;
    logger.info(`Fetching Binance REST orderbook for ${symbol} from ${url}`);

    const response = await axios.get(url);
    const data = response.data; // shape: { bids: [[price, qty], ...], asks: [[price, qty], ...] }

    if (data && data.bids && data.asks && data.bids.length && data.asks.length) {
      const bestBid = parseFloat(data.bids[0][0]);
      const bestAsk = parseFloat(data.asks[0][0]);

      const orderbook: Orderbook = {
        pair: symbol,
        exchange: config.name,
        bid: bestBid,
        ask: bestAsk,
        mid: calculateMidPrice(bestBid, bestAsk),
        timestamp: Date.now(),
      };

      await setValue(`${config.name}-${symbol}`, orderbook);
      logger.info(`[REST] Updated Binance orderbook for ${symbol}`, orderbook);
    } else {
      logger.warn(`Binance REST API returned incomplete data for ${symbol}`);
    }
  } catch (error) {
    logger.error(`Error fetching Binance orderbook via REST for ${pair}:`, error);
  }
};



export const checkTradingPair = async (pair: string): Promise<boolean> => {
  if (!pair) {
    return false;
  }

  const symbol = pair.toUpperCase(); // e.g. BTCUSDT
  try {
    const url = `${config.restApi}?symbol=${symbol}&limit=1`; 
    const response = await axios.get(url);
    // If we get a successful response with status 200, assume it's valid
    return response.status === 200;
  } catch (error) {
    // If the request fails (404 or other), the pair is likely invalid
    return false;
  }
};
export const fetchOrderbookBinance = async (pair: string): Promise<void> => {

  if (isWsConnected) {
    return;
  }

  await fetchOrderbookBinanceRest(pair);
};

