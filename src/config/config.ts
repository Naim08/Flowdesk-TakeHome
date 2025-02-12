// src/config/config.ts
import dotenv from 'dotenv';

dotenv.config();

const config = {
  app: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },
  exchanges: {
    binance: {
      wsUrl: 'wss://ws-api.binance.us:9443/ws-api/v3',
      restUrl: 'https://api.binance.us/api/v3/depth',
      depth: 20
    },
    kraken: {
      restUrl: 'https://api.kraken.com/0/public',
      depth: 10
    },
    huobi: {
      restUrl: 'https://api.huobi.pro/market',
      depth: 5
    }
  },
  caching: {
    updateInterval: process.env.UPDATE_INTERVAL ? 
      parseInt(process.env.UPDATE_INTERVAL) : 5000
  }
};

export default config;