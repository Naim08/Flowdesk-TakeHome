import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getGlobalPrice } from "../controllers/globalprice.controller";

import { addTradingPair } from "../services/orderbook.service";
import { logger } from "../utils/logger";

const router = Router();

/**
 * Route to fetch the global price of a trading pair.
 */
router.get("/price/:pair", asyncHandler(getGlobalPrice));

router.post('/price/:pair', async (req, res) => {
    try {
      const pair = req.params.pair.toUpperCase();
      await addTradingPair(pair);
      res.status(201).json({ message: `Added ${pair} to tracking` });
    } catch (error) {
      logger.error(`Failed to add trading pair: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

export default router;
