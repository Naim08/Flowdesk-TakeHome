import { calculateAverage, getDecimalPlaces, truncateDecimals } from '../../utils/calculator';

describe('Unit Test: Calculator Utils', () => {

  test('calculateAverage with no values', () => {
    expect(calculateAverage([])).toBe(0);
  });

  test('calculateAverage with two values', () => {
    expect(calculateAverage([4, 8])).toBe(6);
  });

  test('calculateAverage with one value', () => {
    expect(calculateAverage([5])).toBe(5);
  });

  test('calculateAverage with multiple values', () => {
    expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
  });

  test('getDecimalPlaces with integer', () => {
    expect(getDecimalPlaces(5)).toBe(0);
  });

  test('getDecimalPlaces with decimal', () => {
    expect(getDecimalPlaces(5.5)).toBe(1);
  });

  test('getDecimalPlaces with multiple decimal places', () => {
    expect(getDecimalPlaces(5.555)).toBe(3);
  });

  test('truncateDecimals with integer', () => {
    expect(truncateDecimals(5, 2)).toBe(5);
  });

  test('truncateDecimals with decimal', () => {
    expect(truncateDecimals(5.5, 0)).toBe(5);
  });

  test('truncateDecimals with one decimal places', () => {
    expect(truncateDecimals(5.555, 1)).toBe(5.5);
  });

  test('truncateDecimals with two decimal places', () => {
    expect(truncateDecimals(5.555, 2)).toBe(5.55);
  });

  test('truncateDecimals with multiple decimal places', () => {
    expect(truncateDecimals(5.555, 3)).toBe(5.555);
  });
});