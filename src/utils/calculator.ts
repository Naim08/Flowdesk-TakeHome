// export const calculateAverage = (arr: number[]): number => {
//   if (arr.length === 0) {
//     return 0;
//   }

//   let avg = arr.reduce((acc, curr) => acc + curr, 0) / arr.length;
//   let decimalPlaces = 0;

//   for (let i = 0; i < arr.length; i++) {
//     decimalPlaces = Math.max(decimalPlaces, getDecimalPlaces(arr[i]));
//   }

//   return truncateDecimals(avg, decimalPlaces + 1);
// }

// export const getDecimalPlaces = (num: number): number => {
//   const parts = num.toString().split('.');
//   return parts.length > 1 ? parts[1].length : 0;
// }

// export const truncateDecimals = (num: number, decimalPlaces: number): number => {
//   return Math.trunc(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
// }

// export const calculateAverage = (values: number[]): number => {
//   if (!values.length) return 0;
//   return values.reduce((sum, val) => sum + val, 0) / values.length;
// };

// export const roundToDecimals = (value: number, decimals: number = 2): number => {
//   const factor = Math.pow(10, decimals);
//   return Math.round(value * factor) / factor;
// };

// export const calculateWeightedAverage = (values: number[], weights: number[]): number => {
//   if (values.length !== weights.length || values.length === 0) return 0;
//   const weightedSum = values.reduce((sum, val, index) => sum + val * weights[index], 0);
//   const totalWeight = weights.reduce((sum, w) => sum + w, 0);
//   return totalWeight ? weightedSum / totalWeight : 0;
// };

type RoundingMode = 'ceil' | 'floor' | 'round' | 'trunc';

/**
 * Mathematical utility functions with enhanced precision handling
 */
export const MathUtils = {
  /**
   * Calculate arithmetic mean of number array
   * @throws {Error} When input contains invalid numbers
   */
  calculateAverage: (values: number[]): number => {
    if (!values.length) return 0;
    validateNumberArray(values);
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  },

  /**
   * Round number to specified decimals with mode selection
   * @param precision Number of decimal places (default: 2)
   * @param mode Rounding mode (default: 'round')
   * @throws {Error} When input is not finite
   */
  roundToDecimals: (
    value: number,
    precision: number = 2,
    mode: RoundingMode = 'round'
  ): number => {
    validateFiniteNumber(value);
    validatePrecision(precision);

    const factor = Math.pow(10, precision);
    const methods = {
      ceil: Math.ceil,
      floor: Math.floor,
      round: Math.round,
      trunc: Math.trunc
    };

    return methods[mode](value * factor) / factor;
  },

  /**
   * Calculate weighted average with optional normalization
   * @param normalize Automatically normalize weights to sum 1 (default: true)
   * @throws {Error} When inputs are invalid or mismatched
   */
  calculateWeightedAverage: (
    values: number[],
    weights: number[],
    normalize: boolean = true
  ): number => {
    validateNumberArray(values);
    validateNumberArray(weights);
    
    if (values.length !== weights.length) {
      throw new Error('Values and weights arrays must have equal length');
    }

    if (values.length === 0) return 0;

    const [safeWeights, totalWeight] = normalizeWeights(weights, normalize);
    
    return values.reduce((acc, val, index) => {
      return acc + val * safeWeights[index];
    }, 0) / totalWeight;
  }
};

// Helper validation functions
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

/**
 * Calculate the mid-price between best bid and best ask
 * @throws {Error} When inputs are not finite or bestBid > bestAsk
 */
export const calculateMidPrice = (bestBid: number, bestAsk: number): number => {
  validateFiniteNumber(bestBid);
  validateFiniteNumber(bestAsk);

  if (bestBid > bestAsk) {
    throw new Error('Best bid cannot be greater than best ask');
  }

  return (bestBid + bestAsk) / 2;
};