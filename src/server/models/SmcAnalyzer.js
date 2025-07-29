class SmcAnalyzer {
	constructor() {
		this.liquidityLevels = [];
		this.orderBlocks = [];
		this.marketStructure = {
			trend: null,
			keyLevels: [],
			breakers: [],
			mitigation: []
		};
	}

	identifyOrderBlocks(data) {
		/**
		 * Identify institutional order blocks
		 * @param {Array} data - Market data array with OHLC data
		 * @returns {Array} - Identified order blocks
		 */
		const blocks = [];
		
		// Analyze candles for order blocks
		for (let i = 2; i < data.length - 2; i++) {
			const candles = data.slice(i - 2, i + 3);
			
			// Bullish Order Block
			if (this._isBullishOrderBlock(candles)) {
				blocks.push({
					type: 'bullish',
					entry: candles[0].low,
					stop: candles[0].high,
					time: candles[0].time,
					strength: this._calculateBlockStrength(candles),
					volume: candles[0].volume,
					mitigation: false
				});
			}
			
			// Bearish Order Block
			if (this._isBearishOrderBlock(candles)) {
				blocks.push({
					type: 'bearish',
					entry: candles[0].high,
					stop: candles[0].low,
					time: candles[0].time,
					strength: this._calculateBlockStrength(candles),
					volume: candles[0].volume,
					mitigation: false
				});
			}
		}

		// Sort blocks by strength
		blocks.sort((a, b) => b.strength - a.strength);
		this.orderBlocks = blocks;
		return blocks;
	}

	findLiquidityLevels(data) {
		/**
		 * Find liquidity levels based on SMC concepts
		 * @param {Array} data - Market data array
		 * @returns {Array} - Identified liquidity levels
		 */
		const levels = [];
		const equalHighs = this._findEqualHighs(data);
		const equalLows = this._findEqualLows(data);
		
		// Process equal highs (resistance liquidity)
		equalHighs.forEach(high => {
			levels.push({
				type: 'resistance',
				price: high.price,
				strength: high.count,
				swept: false,
				time: high.time
			});
		});

		// Process equal lows (support liquidity)
		equalLows.forEach(low => {
			levels.push({
				type: 'support',
				price: low.price,
				strength: low.count,
				swept: false,
				time: low.time
			});
		});

		// Identify stop hunt levels
		const stopHunts = this._findStopHuntLevels(data);
		levels.push(...stopHunts);

		this.liquidityLevels = levels;
		return levels;
	}

	detectMarketStructure(data) {
		/**
		 * Analyze market structure for potential trades
		 * @param {Array} data - Market data array
		 * @returns {Object} - Market structure analysis
		 */
		// Identify market structure breaks
		const breaks = this._findStructureBreaks(data);
		
		// Identify swing points
		const swings = this._findSwingPoints(data);
		
		// Determine overall trend
		const trend = this._determineTrend(swings);
		
		// Find key levels
		const keyLevels = this._findKeyLevels(data, swings);
		
		// Check for previous mitigation
		this._checkMitigation(data);
		
		const structure = {
			trend: trend,
			breaks: breaks,
			swingHighs: swings.highs,
			swingLows: swings.lows,
			keyLevels: keyLevels,
			breakers: this.marketStructure.breakers,
			mitigation: this.marketStructure.mitigation
		};

		this.marketStructure = structure;
		return structure;
	}

	_isBullishOrderBlock(candles) {
		const [ob, trigger, current] = candles;
		
		// Check for bearish candle followed by strong bullish move
		return (
			ob.close < ob.open && // Bearish candle
			trigger.close > trigger.open && // Bullish trigger
			current.close > trigger.high && // Strong momentum
			ob.volume > this._calculateAverageVolume(candles) // High volume
		);
	}

	_isBearishOrderBlock(candles) {
		const [ob, trigger, current] = candles;
		
		// Check for bullish candle followed by strong bearish move
		return (
			ob.close > ob.open && // Bullish candle
			trigger.close < trigger.open && // Bearish trigger
			current.close < trigger.low && // Strong momentum
			ob.volume > this._calculateAverageVolume(candles) // High volume
		);
	}

	_calculateBlockStrength(candles) {
		const [ob, trigger, current] = candles;
		
		// Calculate strength based on volume and price movement
		const volumeStrength = ob.volume / this._calculateAverageVolume(candles);
		const priceMovement = Math.abs(current.close - ob.close) / ob.close;
		
		return volumeStrength * priceMovement;
	}

	_findEqualHighs(data) {
		const tolerance = 0.0001; // Price tolerance for equality
		const highs = {};
		
		data.forEach(candle => {
			const roundedHigh = Math.round(candle.high / tolerance) * tolerance;
			if (!highs[roundedHigh]) {
				highs[roundedHigh] = {
					price: roundedHigh,
					count: 1,
					time: candle.time
				};
			} else {
				highs[roundedHigh].count++;
			}
		});

		return Object.values(highs).filter(h => h.count >= 3);
	}

	_findEqualLows(data) {
		const tolerance = 0.0001; // Price tolerance for equality
		const lows = {};
		
		data.forEach(candle => {
			const roundedLow = Math.round(candle.low / tolerance) * tolerance;
			if (!lows[roundedLow]) {
				lows[roundedLow] = {
					price: roundedLow,
					count: 1,
					time: candle.time
				};
			} else {
				lows[roundedLow].count++;
			}
		});

		return Object.values(lows).filter(l => l.count >= 3);
	}

	_findStopHuntLevels(data) {
		const levels = [];
		const atr = this._calculateATR(data);
		
		for (let i = 1; i < data.length - 1; i++) {
			// Look for price spikes that quickly reverse
			if (
				data[i].high > data[i-1].high + atr &&
				data[i+1].close < data[i].low
			) {
				levels.push({
					type: 'stop_hunt_high',
					price: data[i].high,
					strength: Math.abs(data[i+1].close - data[i].high) / atr,
					time: data[i].time
				});
			}
			
			if (
				data[i].low < data[i-1].low - atr &&
				data[i+1].close > data[i].high
			) {
				levels.push({
					type: 'stop_hunt_low',
					price: data[i].low,
					strength: Math.abs(data[i+1].close - data[i].low) / atr,
					time: data[i].time
				});
			}
		}
		
		return levels;
	}

	_findStructureBreaks(data) {
		const breaks = [];
		const swings = this._findSwingPoints(data);
		
		// Look for breaks of previous structure
		for (let i = 1; i < swings.highs.length; i++) {
			if (swings.highs[i].price < swings.highs[i-1].price &&
				swings.lows[i].price < swings.lows[i-1].price) {
				breaks.push({
					type: 'bearish',
					price: swings.lows[i].price,
					time: swings.lows[i].time
				});
			}
			
			if (swings.highs[i].price > swings.highs[i-1].price &&
				swings.lows[i].price > swings.lows[i-1].price) {
				breaks.push({
					type: 'bullish',
					price: swings.highs[i].price,
					time: swings.highs[i].time
				});
			}
		}
		
		return breaks;
	}

	_findSwingPoints(data) {
		const highs = [];
		const lows = [];
		
		for (let i = 2; i < data.length - 2; i++) {
			// Swing high
			if (
				data[i].high > data[i-1].high &&
				data[i].high > data[i-2].high &&
				data[i].high > data[i+1].high &&
				data[i].high > data[i+2].high
			) {
				highs.push({
					price: data[i].high,
					time: data[i].time
				});
			}
			
			// Swing low
			if (
				data[i].low < data[i-1].low &&
				data[i].low < data[i-2].low &&
				data[i].low < data[i+1].low &&
				data[i].low < data[i+2].low
			) {
				lows.push({
					price: data[i].low,
					time: data[i].time
				});
			}
		}
		
		return { highs, lows };
	}

	_determineTrend(swings) {
		const recentHighs = swings.highs.slice(-3);
		const recentLows = swings.lows.slice(-3);
		
		if (
			recentHighs.every((h, i, arr) => !i || h.price > arr[i-1].price) &&
			recentLows.every((l, i, arr) => !i || l.price > arr[i-1].price)
		) {
			return 'uptrend';
		}
		
		if (
			recentHighs.every((h, i, arr) => !i || h.price < arr[i-1].price) &&
			recentLows.every((l, i, arr) => !i || l.price < arr[i-1].price)
		) {
			return 'downtrend';
		}
		
		return 'ranging';
	}

	_findKeyLevels(data, swings) {
		const levels = [];
		const atr = this._calculateATR(data);
		
		// Add significant swing points
		swings.highs.forEach(high => {
			if (this._isSignificantLevel(high.price, data, atr)) {
				levels.push({
					type: 'resistance',
					price: high.price,
					time: high.time,
					strength: this._calculateLevelStrength(high.price, data)
				});
			}
		});
		
		swings.lows.forEach(low => {
			if (this._isSignificantLevel(low.price, data, atr)) {
				levels.push({
					type: 'support',
					price: low.price,
					time: low.time,
					strength: this._calculateLevelStrength(low.price, data)
				});
			}
		});
		
		return levels.sort((a, b) => b.strength - a.strength);
	}

	_checkMitigation(data) {
		// Check if order blocks have been mitigated
		this.orderBlocks.forEach(block => {
			const mitigationPrice = block.type === 'bullish' ? block.entry : block.stop;
			const isMitigated = data.some(candle => 
				block.type === 'bullish' ? 
				candle.low <= mitigationPrice :
				candle.high >= mitigationPrice
			);
			
			if (isMitigated && !block.mitigation) {
				block.mitigation = true;
				this.marketStructure.mitigation.push({
					type: block.type,
					price: mitigationPrice,
					time: block.time
				});
			}
		});
	}

	_calculateATR(data, period = 14) {
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

	_calculateAverageVolume(candles) {
		return candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
	}

	_isSignificantLevel(price, data, atr) {
		// Count how many times price interacts with this level
		let interactions = 0;
		const tolerance = atr * 0.5;
		
		data.forEach(candle => {
			if (Math.abs(candle.high - price) <= tolerance ||
				Math.abs(candle.low - price) <= tolerance) {
				interactions++;
			}
		});
		
		return interactions >= 3;
	}

	_calculateLevelStrength(price, data) {
		let touches = 0;
		let respects = 0;
		const tolerance = this._calculateATR(data) * 0.5;
		
		data.forEach(candle => {
			if (Math.abs(candle.high - price) <= tolerance ||
				Math.abs(candle.low - price) <= tolerance) {
				touches++;
				if (Math.abs(candle.close - price) > tolerance) {
					respects++;
				}
			}
		});
		
		return (touches + respects) / 2;
	}
}

module.exports = SmcAnalyzer;