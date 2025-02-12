interface Orderbook {
  ask: number;
  bid: number;
  mid: number;
  pair: string;
  exchange: string;
  timestamp: number;
}

export default Orderbook
