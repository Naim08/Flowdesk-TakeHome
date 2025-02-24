

import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { getGlobalPriceIndex, addTradingPair, tradingpairExists } from "../services/orderbook.service";
import PriceInterface from "../services/price.interface";
import { fetchOrderbookBinance, initBinanceWebsocket } from "../services/exchanges/binance/binance.service";
import { fetchOrderbookKraken, initKrakenWebsocket } from "../services/exchanges/kraken/kraken.service";
import { fetchOrderbookHuobi, initHuobiWebsocket } from "../services/exchanges/huobi/huobi.service";
import { log } from "winston";

/**
 * Controller to get the global price for a trading pair.
 */
export const getGlobalPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pair } = req.params;
   
   const tradingPair = pair.toUpperCase();
  logger.info(`GET /price/${pair} requested`);

  
    
    if (!(await tradingpairExists(tradingPair))) {
      await addTradingPair(tradingPair);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to allow fetching
    }
    // (Optional) Add logic to map pair names if needed:
  // Kraken might need "BTCUSD" instead of "BTCUSDT"
  const krakenPair = tradingPair.replace("USDT", "USD"); // e.g. "BTCUSD"
  // Huobi might want lowercase "btcusdt"
  const huobiPair = tradingPair.toLowerCase();          // e.g. "btcusdt"

  // 1) Initialize the WS for each exchange (if not already running).
  //    If the WS is already open, your service might skip or just re-subscribe.
  await initBinanceWebsocket([tradingPair]);
  await initKrakenWebsocket([krakenPair]);
  await initHuobiWebsocket([huobiPair]);

  // 2) Force a fallback REST fetch if the WS isn't connected (fetchOrderbookXXX does that).
  //    This ensures you get at least one snapshot if the WS is newly connected.
  await fetchOrderbookBinance(tradingPair);
  await fetchOrderbookKraken(krakenPair);
  await fetchOrderbookHuobi(huobiPair);
    const priceData: PriceInterface = await getGlobalPriceIndex(tradingPair);
    
    if (priceData.price <= 0) {
      res.status(400).json({ error: `Price not found for pair ${tradingPair}` });
      return;
    }
    
    res.status(200).json(priceData);
  } catch (error) {
    logger.error("Error fetching global price", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
