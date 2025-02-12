interface Depth {
  error: [];
  result: { [key: string]: Tick };
}

interface Tick {
  asks: number[][];
  bids: number[][];
}

export default Depth;
