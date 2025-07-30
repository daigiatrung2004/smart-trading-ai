const SmcAnalyzer = require('../models/SmcAnalyzer');
const IctAnalyzer = require('../models/IctAnalyzer');
const WebSocket = require('ws');
const axios = require('axios');
const readline = require('readline');

class SignalGenerator {
  constructor() {
    this.smc = new SmcAnalyzer();
    this.ict = new IctAnalyzer();
    this.marketData = [];
    this.symbol = null;
    this.timeframe = '1h';
    this.ws = null;
    this.tradeHistory = {
      long: { wins: 0, total: 0 },
      short: { wins: 0, total: 0 }
    };
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async init() {
    console.log('Smart Trading AI Signal Generator');
    console.log('================================');
    
    let validPair = false;
    while (!validPair) {
      try {
        this.symbol = await this.askQuestion('Enter trading pair (e.g. BTCUSDT): ');
        
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
          params: {
            symbol: this.symbol.replace(/\s+/g, '').toUpperCase()
          }
        });
        
        if (response.data.symbol) {
          validPair = true;
        }
      } catch (error) {
        console.log('Invalid trading pair. Please try again.');
      }
    }
    
    let validTimeframe = false;
    while (!validTimeframe) {
      this.timeframe = await this.askQuestion('Enter timeframe (1m/5m/15m/1h/4h/1d): ');
      if (['1m', '5m', '15m', '1h', '4h', '1d'].includes(this.timeframe.toLowerCase())) {
        validTimeframe = true;
      } else {
        console.log('Invalid timeframe. Please choose from: 1m, 5m, 15m, 1h, 4h, 1d');
      }
    }
    
    await this.loadHistoricalData();
    this.initializeWebSocket();
    this.handleUserCommands();
  }

  askQuestion(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => resolve(answer.toUpperCase()));
    });
  }

  async loadHistoricalData() {
    try {
      console.log('Loading historical data...');
      
      const intervalMap = {
        '1M': '1m',
        '5M': '5m', 
        '15M': '15m',
        '1H': '1h',
        '4H': '4h',
        '1D': '1d',
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1h': '1h',
        '4h': '4h',
        '1d': '1d'
      };
      
      this.timeframe = this.timeframe.toLowerCase();
      const interval = intervalMap[this.timeframe];
      
      if (!interval) {
        throw new Error('Invalid timeframe');
      }

      const symbol = this.symbol.replace(/\s+/g, '').toUpperCase();
      console.log(`Fetching data for ${symbol} on ${interval} timeframe...`);
      
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines`,
        {
          params: {
            symbol: symbol,
            interval: interval,
            limit: 1000
          }
        }
      );

      this.marketData = response.data.map(d => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }));

      console.log(`Loaded ${this.marketData.length} historical candles`);
      this.analyzeMarket();
      
    } catch (error) {
      console.error('Error loading historical data:', error.message);
    }
  }

  initializeWebSocket() {
    const wsUrl = `wss://stream.binance.com:9443/ws/${this.symbol.toLowerCase()}@kline_${this.timeframe}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      console.log('\n? WebSocket connection established');
    });
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('\n? Received market data update');
        
        if (message.e === 'kline') {
          const kline = message.k;
          console.log(`Time: ${new Date(kline.t).toISOString()}`);
          console.log(`Price: ${kline.c}`);
          
          if (kline.x) { // Candle closed
            console.log('\n? New candle closed, updating analysis...');
            
            const candle = {
              time: kline.t,
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v)
            };
            
            this.marketData.push(candle);
            this.marketData = this.marketData.slice(-1000);
            this.analyzeMarket();
          }
        }
      } catch (error) {
        console.error('Error processing websocket message:', error);
      }
    });
    
    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });
    
    this.ws.on('close', () => {
      console.log('WebSocket connection closed');
      setTimeout(() => this.initializeWebSocket(), 5000);
    });
  }

  handleUserCommands() {
    this.rl.on('line', (input) => {
      const command = input.toLowerCase().trim();
      
      switch(command) {
        case 'analyze':
          this.analyzeMarket();
          break;
        case 'stats':
          this.showStats();
          break;
        case 'help':
          this.showHelp();
          break;
        case 'exit':
          this.cleanup();
          break;
        default:
          console.log('Unknown command. Type "help" for available commands.');
      }
    });
  }

  analyzeMarket() {
    try {
      console.log('\n? Analyzing market data...');
      
      console.log('Generating SMC analysis...');
      const smcBlocks = this.smc.identifyOrderBlocks(this.marketData);
      const smcLevels = this.smc.findLiquidityLevels(this.marketData);
      const smcStructure = this.smc.detectMarketStructure(this.marketData);
      
      console.log('Generating ICT analysis...');
      const fvgs = this.ict.identifyFvg(this.marketData);
      const ictEntries = this.ict.findOptimalEntries(this.marketData);
      
      const signals = this.generateSignals(this.marketData);
    
      console.log('\n=== Market Analysis Update ===');
      console.log(`Symbol: ${this.symbol} | Timeframe: ${this.timeframe}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`\nMarket Structure: ${smcStructure.trend}`);
      
      if (signals.length > 0) {
        console.log('\n? Trading Signals:');
        signals.forEach(signal => {
          const riskUsd = Math.abs(signal.price - signal.stopLoss);
          console.log(`\n${signal.direction === 'long' ? '?' : '?'} ${signal.type} ${signal.direction.toUpperCase()}`);
          console.log(`Entry Price: ${signal.price}`);
          console.log(`Stop Loss: ${signal.stopLoss} (${((Math.abs(signal.price - signal.stopLoss) / signal.price) * 100).toFixed(2)}%)`);
          console.log(`Targets:`);
          signal.targets.forEach((target, i) => {
            const profit = signal.direction === 'long' ? target - signal.price : signal.price - target;
            const profitPercent = (profit / signal.price * 100).toFixed(2);
            console.log(`  ${i + 1}. ${target} (${profitPercent}%)`);
          });
          console.log(`Position Size: ${signal.volume} ${this.symbol.replace('USDT', '')}`);
          console.log(`Leverage: ${signal.leverage}x`);
          console.log(`Risk/Reward: ${signal.riskRewardRatio}`);
          console.log(`Win Rate: ${signal.winRate}%`);
          console.log(`Confidence: ${signal.confidence}%`);
          console.log('------------------------');
        });
      } else {
        console.log('\nNo trading signals at this time');
      }
      
      if (fvgs.length > 0) {
        console.log('\nFair Value Gaps:');
        fvgs.forEach(fvg => {
          console.log(`${fvg.type.toUpperCase()} FVG: ${fvg.floor} - ${fvg.ceiling}`);
        });
      }
      
      if (smcLevels.length > 0) {
        console.log('\nLiquidity Levels:');
        smcLevels.forEach(level => {
          console.log(`${level.type.toUpperCase()}: ${level.price}`);
        });
      }
      
    } catch (error) {
      console.error('Error analyzing market:', error.message);
    }
  }

  generateSignals(marketData) {
    const signals = [];
    const lastCandle = marketData[marketData.length - 1];
    const currentPrice = lastCandle.close;
    
    const smcBlocks = this.smc.orderBlocks;
    const smcLevels = this.smc.liquidityLevels;
    const smcStructure = this.smc.marketStructure;
    
    const longSetup = this.checkLongSetup(currentPrice, smcBlocks, smcLevels, smcStructure);
    if (longSetup) {
      const stopLoss = this.calculateStopLoss(longSetup, 'long');
      const targets = this.identifyTargets(longSetup, 'long');
      const risk = currentPrice - stopLoss;
      const reward = targets[0] - currentPrice;
      const riskRewardRatio = reward / risk;
      
      signals.push({
        type: 'SMC + ICT',
        direction: 'long',
        price: currentPrice,
        stopLoss: stopLoss,
        targets: targets,
        confidence: this.calculateConfidence(longSetup),
        volume: this.calculatePositionSize(currentPrice, stopLoss),
        leverage: this.calculateOptimalLeverage(risk, currentPrice),
        riskRewardRatio: riskRewardRatio.toFixed(2),
        winRate: this.calculateHistoricalWinRate('long', riskRewardRatio)
      });
    }
    
    const shortSetup = this.checkShortSetup(currentPrice, smcBlocks, smcLevels, smcStructure);
    if (shortSetup) {
      const stopLoss = this.calculateStopLoss(shortSetup, 'short');
      const targets = this.identifyTargets(shortSetup, 'short');
      const risk = stopLoss - currentPrice;
      const reward = currentPrice - targets[0];
      const riskRewardRatio = reward / risk;
      
      signals.push({
        type: 'SMC + ICT',
        direction: 'short',
        price: currentPrice,
        stopLoss: stopLoss,
        targets: targets,
        confidence: this.calculateConfidence(shortSetup),
        volume: this.calculatePositionSize(currentPrice, stopLoss),
        leverage: this.calculateOptimalLeverage(risk, currentPrice),
        riskRewardRatio: riskRewardRatio.toFixed(2),
        winRate: this.calculateHistoricalWinRate('short', riskRewardRatio)
      });
    }
    
    return signals;
  }

  checkLongSetup(price, blocks, levels, structure) {
    const validBlocks = blocks.filter(b => 
      b.type === 'bullish' && 
      !b.mitigation &&
      price >= b.entry * 0.95 &&
      price <= b.entry * 1.05
    );
    
    if (validBlocks.length === 0) return null;
    
    const supports = levels.filter(l => 
      (l.type === 'support' || l.type === 'stop_hunt_low') &&
      l.price < price &&
      !l.swept
    ).sort((a, b) => b.price - a.price);
    
    if (supports.length === 0) return null;
    
    if (structure.trend === 'uptrend' || structure.trend === 'ranging') {
      return {
        block: validBlocks[0],
        support: supports[0],
        structure: structure
      };
    }
    
    return null;
  }

  checkShortSetup(price, blocks, levels, structure) {
    const validBlocks = blocks.filter(b => 
      b.type === 'bearish' && 
      !b.mitigation &&
      price <= b.entry * 1.05 &&
      price >= b.entry * 0.95
    );
    
    if (validBlocks.length === 0) return null;
    
    const resistances = levels.filter(l => 
      (l.type === 'resistance' || l.type === 'stop_hunt_high') &&
      l.price > price &&
      !l.swept
    ).sort((a, b) => a.price - b.price);
    
    if (resistances.length === 0) return null;
    
    if (structure.trend === 'downtrend' || structure.trend === 'ranging') {
      return {
        block: validBlocks[0],
        resistance: resistances[0],
        structure: structure
      };
    }
    
    return null;
  }

  calculateStopLoss(setup, direction) {
    if (direction === 'long') {
      return Math.min(
        setup.block.stop,
        setup.support.price * 0.99
      );
    } else {
      return Math.max(
        setup.block.stop,
        setup.resistance.price * 1.01
      );
    }
  }

  identifyTargets(setup, direction) {
    const targets = [];
    const atr = this.calculateATR(this.marketData);
    
    if (direction === 'long') {
      targets.push(setup.structure.keyLevels.find(l => l.type === 'resistance' && l.price > setup.block.entry)?.price);
      targets.push(setup.block.entry + (2 * atr));
      targets.push(Math.max(...setup.structure.swingHighs.map(h => h.price)));
    } else {
      targets.push(setup.structure.keyLevels.find(l => l.type === 'support' && l.price < setup.block.entry)?.price);
      targets.push(setup.block.entry - (2 * atr));
      targets.push(Math.min(...setup.structure.swingLows.map(l => l.price)));
    }
    
    return targets.filter(t => t !== undefined).map(t => parseFloat(t.toFixed(8)));
  }

  calculateConfidence(setup) {
    let confidence = 50;
    
    if (setup.block.type === 'bullish' && setup.structure.trend === 'uptrend') {
      confidence += 20;
    } else if (setup.block.type === 'bearish' && setup.structure.trend === 'downtrend') {
      confidence += 20;
    }
    
    confidence += Math.min(20, setup.block.strength * 10);
    
    const level = setup.block.type === 'bullish' ? setup.support : setup.resistance;
    confidence += Math.min(10, level.strength * 5);
    
    return Math.min(100, Math.round(confidence));
  }

  calculateATR(data, period = 14) {
    let sum = 0;
    for (let i = 1; i < period; i++) {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i-1].close),
        Math.abs(data[i].low - data[i-1].close)
      );
      sum += tr;
    }
    return sum / period;
  }

  showStats() {
    const last = this.marketData[this.marketData.length - 1];
    console.log('\n=== Market Statistics ===');
    console.log(`Symbol: ${this.symbol}`);
    console.log(`Current Price: ${last.close}`);
    console.log(`24h High: ${Math.max(...this.marketData.slice(-24).map(d => d.high))}`);
    console.log(`24h Low: ${Math.min(...this.marketData.slice(-24).map(d => d.low))}`);
    console.log(`Market Structure: ${this.smc.marketStructure.trend}`);
    console.log(`Active Order Blocks: ${this.smc.orderBlocks.filter(b => !b.mitigation).length}`);
  }

  showHelp() {
    console.log('\nAvailable commands:');
    console.log('analyze - Generate new market analysis');
    console.log('stats   - Show market statistics');
    console.log('help    - Show this help message');
    console.log('exit    - Exit the program');
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    this.rl.close();
    process.exit(0);
  }

  calculatePositionSize(entryPrice, stopLoss) {
    const riskPerTrade = 100;
    const riskAmount = Math.abs(entryPrice - stopLoss);
    return (riskPerTrade / riskAmount).toFixed(8);
  }

  calculateOptimalLeverage(risk, price) {
    const maxLeverage = 20;
    const minLeverage = 1;
    const riskPercent = (risk / price) * 100;
    
    let leverage = Math.round(1 / riskPercent);
    leverage = Math.min(maxLeverage, Math.max(minLeverage, leverage));
    
    return leverage;
  }

  calculateHistoricalWinRate(direction, rr) {
    const history = this.tradeHistory[direction];
    if (history.total === 0) return 50;
    
    const baseWinRate = (history.wins / history.total) * 100;
    const rrAdjustment = (parseFloat(rr) - 1) * 5;
    
    return Math.min(95, Math.max(5, baseWinRate + rrAdjustment));
  }
}

module.exports = SignalGenerator;
