interface Data {
  id: number;
  result: string[];
  stream: string;
  data: Tick;
}

interface Tick {
  asks: number[][];
  bids: number[][];
}

export default Data;
