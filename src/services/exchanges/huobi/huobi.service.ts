import axios from "axios";
import Depth from "./huobi.interface";
import logger from '../../../utils/logger'
import Orderbook from "../../../models/orderbook.model";
import { memoryStore } from "../../../config/memorystore";
import { MathUtils } from "../../../utils/calculator";

const config = {
  name: "huobi",
  url: "https://api.huobi.pro/market/depth",
  depth: 5,
};


export const fetchOrderbookHuobiRest = async (pair: string): Promise<void> => {
  if (!pair) {
    return
  }

  pair = pair.toUpperCase()
  try {
    const response = await axios.get(config.url, {
      params: {
        symbol: pair.toLowerCase(),
        depth: config.depth,
        type: "step0",
      },
    });

    if (response.status !== 200 || response.data.status === "error") {
      // logger.error(`fetchOrderbookHuobi: `, response.data['err-msg']);
      return
    }

    const data: Depth = response.data;
    const bestAsk = Math.min(...data.tick.asks.map((ask) => ask[0]));
    const bestBid = Math.max(...data.tick.bids.map((bid) => bid[0]));
    const midPrice = MathUtils.calculateAverage([bestAsk, bestBid]);


    const pairExchange = `${config.name}-${pair}`
    await memoryStore.delete(pairExchange)
    const pairExchangeOrderbook: Orderbook = {
      ask: bestAsk,
      bid: bestBid,
      mid: midPrice,
      pair: pair,
      exchange: config.name,
      timestamp: 0
    }
    await memoryStore.set(pairExchange, pairExchangeOrderbook)
  } catch (error) {
    logger.error(`fetchOrderbookHuobi: ${error}`);
  }
  return
};

