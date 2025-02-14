<h1 align='center'>
  Flowdesk API
</h1>

## Overview
As a market maker, having a global price index is essential. This project uses orderbook data from various exchanges to compute a fair mid-price (the average between the best bid and best ask).

## Goals
Expose a REST API that provides the global price index for the BTC/USDT trading pair, computed from three different exchanges:

1. Binance
2. Kraken
3. Huobi

## Specifications
Your mission is to fetch the BTC/USDT order book from the three exchanges listed above, compute the mid-price for each orderbook, and return an average of these mid-prices. The solution should be extensible to add new exchanges in the future.

## Documentation
- Binance API Documentation: 
  - [Binance Spot API WebSocket Streams](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams)
- Kraken API Documentation: 
  - [Kraken API](https://docs.kraken.com/api/)
- Huobi API Documentation: 
  - [Huobi API](https://www.htx.com/en-us/opend/newApiPages)

## Technology Stack
- Node.js
- TypeScript
- Express.js

## Getting Started

To get started with the Flowdesk Crypto Orderbook API, follow these steps:

1. **Clone the repository**:
   ```sh
   git clonegit@github.com:Naim08/Flowdesk-TakeHome.
   cd Flowdesk-TakeHome
   npm install
   npm run dev
   ```
2. Access the API:

Using curl:
```
curl http://localhost:3000/price/BTCUSDT
```
Or open your browser and go to:
http://localhost:3000/price/BTCUSDT



## Added Extras
- Extended support beyond BTC/USDT to any existing trading pair, e.g., LTC/USDT, ETH/USDT
- Included mid-price from each exchange in the API response
- Added a health endpoint for uptime monitoring
- Added a Dockerfile for easier deployment

## Future Improvements
- Monitor REST API calls to avoid rate limiting
- Add more centralized exchanges and their APIs
- Include historical global prices for decision making
- Integrate decentralized exchanges and smart contracts
- Add candlestick and chart patterns for trend monitoring

## How It Works
To use the application, execute the following commands via curl, Postman, or a simple browser page.

1. Sample Response:
```json
{
  "price": 105982.38,
  "pair": "BTCUSDT",
  "exchanges": {
    "binance": 105999.535,
    "kraken": 105998.25,
    "huobi": 105949.355
  }
}