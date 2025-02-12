interface Depth {
  ch: string;
  status: string;
  tick: Tick;
  ts: number;
}

interface Tick {
  asks: number[][];
  bids: number[][];
  ts: number;
  version: number;
}

export default Depth;