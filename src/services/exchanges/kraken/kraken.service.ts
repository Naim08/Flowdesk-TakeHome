import axios from "axios";
import Depth from "./kraken.interface";
import logger from '../../../utils/logger'
import Orderbook from '../../../models/orderbook.model'
import { memoryStore } from "../../../config/memorystore";
import { MathUtils } from "../../../utils/calculator";
import config from '../../../config/config';

const KrakenConfig = config.exchanges.kraken
const name = "kraken"

export const fetchOrderbookKraken = async (pair: string): Promise<void> => {
  if (!pair) {
    return;
  }

  pair = pair.toUpperCase()
  try {
    const response = await axios.get(KrakenConfig.restUrl, {
      params: {
        pair: pair,
        count: KrakenConfig.depth,
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
    const midPrice = MathUtils.calculateAverage([bestAsk, bestBid]);


    const pairExchange = `${name}-${pair}`
    await memoryStore.delete(pairExchange)
    const pairExchangeOrderbook: Orderbook = {
      ask: bestAsk,
      bid: bestBid,
      mid: midPrice,
      pair: pair,
      exchange: name,
      timestamp: 0
    }
    await memoryStore.set(pairExchange, pairExchangeOrderbook)

  } catch (error) {
    logger.error(`catch fetchOrderbookKraken: ${error}`);
  }
};

