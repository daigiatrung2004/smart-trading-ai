import React from 'react';

const TradingPairInput = ({ symbol, onSymbolChange }) => {
  const handleChange = (e) => {
    const newSymbol = e.target.value.toUpperCase().trim();
    if (newSymbol) {
      onSymbolChange(newSymbol);
    }
  };

  const handleBlur = (e) => {
    if (!e.target.value.trim()) {
      onSymbolChange('BTCUSDT'); // Reset to default if empty
    }
  };

  return (
    <div className="input-group">
      <label>Trading Pair:</label>
      <input 
        type="text" 
        value={symbol}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="e.g. BTCUSDT"
      />
    </div>
  );
};

export default TradingPairInput;
