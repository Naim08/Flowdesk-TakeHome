import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { getGlobalPriceIndex, addTradingPair, tradingpairExists } from "../services/orderbook.service";
import PriceInterface from "../services/price.interface";

/**
 * Controller to get the global price for a trading pair.
 */
export const getGlobalPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pair } = req.params;
    
    if (!(await tradingpairExists(pair))) {
      await addTradingPair(pair);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to allow fetching
    }
    
    const priceData: PriceInterface = await getGlobalPriceIndex(pair);
    
    if (priceData.price <= 0) {
      res.status(400).json({ error: `Price not found for pair ${pair}` });
      return;
    }
    
    res.status(200).json(priceData);
  } catch (error) {
    logger.error("Error fetching global price", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
