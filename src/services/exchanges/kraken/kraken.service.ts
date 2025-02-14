import axios from "axios";
import Depth from "./kraken.interface";
import { logger } from '../../../utils/logger'
import Orderbook from '../../../models/orderbook.model'
import { unsetValue, setValue } from "../../../config/memorystore";
import { calculateAverage } from "../../../utils/calculator";

const config = {
  name: "kraken",
  url: "https://api.kraken.com/0/public/Depth",
  depth: 5,
};

export const fetchOrderbookKraken = async (pair: string): Promise<void> => {
  if (!pair) {
    return;
  }

  pair = pair.toUpperCase()
  try {
    const response = await axios.get(config.url, {
      params: {
        pair: pair,
        count: config.depth,
      },
    });

    if (response.status !== 200 || response.data.error.length > 0) {
      // logger.error(`fetchOrderbookKraken: ${response.data.error}`);
      return;
    }

    const data: Depth = response.data;

    if (data.result === undefined || Object.keys(data.result).length === 0) {
      // logger.error(`fetchOrderbookKraken: ${data.error}`);
      return;
    }

    const resultKey = Object.keys(data.result)[0];

    const bestAsk = Math.min(...data.result[resultKey].asks.map((ask) => ask[0]));
    const bestBid = Math.max(...data.result[resultKey].bids.map((bid) => bid[0]));
    const midPrice = calculateAverage([bestAsk, bestBid]);


    const pairExchange = `${config.name}-${pair}`
    await unsetValue(pairExchange)
    const pairExchangeOrderbook: Orderbook = {
      ask: bestAsk,
      bid: bestBid,
      mid: midPrice,
      pair: pair,
      exchange: config.name,
      timestamp: Date.now()
    }
    await setValue(pairExchange, pairExchangeOrderbook)

  } catch (error) {
    logger.error(`catch fetchOrderbookKraken: ${error}`);
  }
};
