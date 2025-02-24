export const calculateAverage = (arr: number[]): number => {
  if (arr.length === 0) {
    return 0;
  }

  let avg = arr.reduce((acc, curr) => acc + curr, 0) / arr.length;
  let decimalPlaces = 0;

  for (let i = 0; i < arr.length; i++) {
    decimalPlaces = Math.max(decimalPlaces, getDecimalPlaces(arr[i]));
  }

  return truncateDecimals(avg, decimalPlaces + 1);
}

export const getDecimalPlaces = (num: number): number => {
  const parts = num.toString().split('.');
  return parts.length > 1 ? parts[1].length : 0;
}

export const truncateDecimals = (num: number, decimalPlaces: number): number => {
  return Math.trunc(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}

const validateNumberArray = (arr: number[]): void => {
  if (!arr.every(Number.isFinite)) {
    throw new Error('Array contains non-finite numbers');
  }
};

const validateFiniteNumber = (num: number): void => {
  if (!Number.isFinite(num)) {
    throw new Error('Value must be a finite number');
  }
};

const validatePrecision = (precision: number): void => {
  if (!Number.isInteger(precision) || precision < 0) {
    throw new Error('Precision must be a non-negative integer');
  }
};

const normalizeWeights = (
  weights: number[],
  normalize: boolean
): [number[], number] => {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }

  return [
    normalize ? weights.map(w => w / totalWeight) : weights,
    normalize ? 1 : totalWeight
  ];
};

export const calculateMidPrice = (bestBid: number, bestAsk: number): number => {
  validateFiniteNumber(bestBid);
  validateFiniteNumber(bestAsk);

  if (bestBid > bestAsk) {
    throw new Error('Best bid cannot be greater than best ask');
  }

  return (bestBid + bestAsk) / 2;
};