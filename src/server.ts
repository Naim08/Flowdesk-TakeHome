import app from "./app";
import logger from "./utils/logger";
import { fetchOrderbook } from "./services/orderbook.service";

/**
 * Initialize order book fetching.
 */
(async () => {
  try {
    await fetchOrderbook();
  } catch (error) {
    logger.error("Failed to start order book fetching", error);
  }
})();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
