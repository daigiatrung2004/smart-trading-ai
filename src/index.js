const SignalGenerator = require('./server/trading/SignalGenerator');

class TradingSystem {
  constructor() {
    this.signalGenerator = new SignalGenerator();
  }

  async start() {
    try {
      await this.signalGenerator.init();
    } catch (error) {
      console.error('Error starting system:', error);
    }
  }
}

// Start the trading system
const tradingSystem = new TradingSystem();
tradingSystem.start();