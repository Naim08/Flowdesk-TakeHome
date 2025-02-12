interface PriceInterface {
  pair: string,
  price: number,
  exchanges: { [key: string]: number };
}

export default PriceInterface;
