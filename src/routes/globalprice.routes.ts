import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getGlobalPrice } from "../controllers/globalprice.controller";

const router = Router();

/**
 * Route to fetch the global price of a trading pair.
 */
router.get("/price/:pair", asyncHandler(getGlobalPrice));

export default router;
