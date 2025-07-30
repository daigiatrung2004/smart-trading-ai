import React from 'react';
import './SignalDisplay.css';

const SignalDisplay = ({ signal, marketData }) => {
  if (!signal && !marketData) {
    return (
      <div className="no-signal">
        <h3>? NO TRADING SIGNALS AT THIS TIME</h3>
        <div className="analyzing">
          <h4>? Currently analyzing market conditions for:</h4>
          <ul>
            <li>Potential entry points</li>
            <li>Support/Resistance levels</li>
            <li>Market structure shifts</li>
            <li>Order blocks & liquidity zones</li>
          </ul>
          <p className="waiting">Please wait for high-probability setups to form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signal-container">
      {signal && (
        <div className="trading-signal">
          <h2>=== TRADING SIGNALS DETECTED ===</h2>
          <div className="signal-details">
            <h3 className={`signal-type ${signal.direction}`}>
              {signal.direction === 'long' ? '?' : '?'} {signal.type} {signal.direction.toUpperCase()} SIGNAL
            </h3>
            
            <div className="entry-points">
              <h4>? ENTRY POINTS:</h4>
              <p>Market Entry: {signal.price}</p>
              <p>Limit Entry: {(signal.price * 0.998).toFixed(2)} - {signal.price}</p>
            </div>

            <div className="stoploss">
              <h4>? STOPLOSS:</h4>
              <p>Price: {signal.stopLoss}</p>
              <p>Risk: {((Math.abs(signal.price - signal.stopLoss) / signal.price) * 100).toFixed(2)}%</p>
            </div>

            <div className="targets">
              <h4>? TARGETS:</h4>
              {signal.targets.map((target, i) => {
                const profit = signal.direction === 'long' ? target - signal.price : signal.price - target;
                const profitPercent = (profit / signal.price * 100).toFixed(2);
                return (
                  <p key={i}>Target {i + 1}: {target} ({profitPercent}%)</p>
                );
              })}
            </div>

            <div className="trade-info">
              <h4>? TRADE INFO:</h4>
              <p>Position Size: {signal.volume} {signal.symbol?.replace('USDT', '')}</p>
              <p>Leverage: {signal.leverage}x</p>
              <p>Risk/Reward: {signal.riskRewardRatio}</p>
              <p>Win Rate: {signal.winRate}%</p>
              <p>Signal Confidence: {signal.confidence}%</p>
            </div>
          </div>
        </div>
      )}

      {marketData && (
        <div className="market-data">
          <h3>Market Analysis</h3>
          {marketData.fvgs?.length > 0 && (
            <div className="fvg-levels">
              <h4>Fair Value Gaps:</h4>
              {marketData.fvgs.map((fvg, i) => (
                <p key={i}>{fvg.type.toUpperCase()} FVG: {fvg.floor} - {fvg.ceiling}</p>
              ))}
            </div>
          )}
          
          {marketData.liquidityLevels?.length > 0 && (
            <div className="liquidity-levels">
              <h4>Liquidity Levels:</h4>
              {marketData.liquidityLevels.map((level, i) => (
                <p key={i}>{level.type.toUpperCase()}: {level.price}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SignalDisplay;
