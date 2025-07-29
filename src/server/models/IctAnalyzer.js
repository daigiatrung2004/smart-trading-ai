class IctAnalyzer {
	constructor() {
		this.fairValueGaps = [];
		this.premiumDiscountZones = [];
		this.marketStructure = {
			swing_highs: [],
			swing_lows: [],
			trend: null
		};
	}

	identifyFvg(data) {
		/**
		 * Identify Fair Value Gaps
		 * @param {Array} data - Market data array with OHLC data
		 * @returns {Array} - Identified FVGs
		 */
		const fvgs = [];
		
		// Loop through candles to find FVGs
		for (let i = 1; i < data.length - 1; i++) {
			const prevCandle = data[i - 1];
			const currentCandle = data[i];
			const nextCandle = data[i + 1];

			// Bullish FVG (gap up)
			if (prevCandle.low > nextCandle.high) {
				fvgs.push({
					type: 'bullish',
					ceiling: prevCandle.low,
					floor: nextCandle.high,
					time: currentCandle.time,
					midpoint: (prevCandle.low + nextCandle.high) / 2
				});
			}
			
			// Bearish FVG (gap down)
			if (prevCandle.high < nextCandle.low) {
				fvgs.push({
					type: 'bearish',
					ceiling: nextCandle.low,
					floor: prevCandle.high,
					time: currentCandle.time,
					midpoint: (nextCandle.low + prevCandle.high) / 2
				});
			}
		}

		this.fairValueGaps = fvgs;
		return fvgs;
	}

	findOptimalEntries(data) {
		/**
		 * Find optimal entry points based on ICT concepts
		 * @param {Array} data - Market data array
		 * @returns {Array} - Optimal entry points
		 */
		const entries = [];
		const orderBlocks = this._findOrderBlocks(data);
		const liquidityLevels = this._findLiquidityLevels(data);
		
		// Update market structure
		this._updateMarketStructure(data);
		
		// Find Premium/Discount zones
		const pdZones = this._findPremiumDiscountZones(data);
		this.premiumDiscountZones = pdZones;

		// Analyze each order block for potential entries
		orderBlocks.forEach(ob => {
			// Check if order block is at a liquidity level
			const nearLiquidity = liquidityLevels.some(level => 
				Math.abs(ob.price - level.price) / level.price < 0.001
			);

			// Check if order block is in premium/discount zone
			const inPDZone = pdZones.some(zone => 
				ob.price >= zone.lower && ob.price <= zone.upper
			);

			if (nearLiquidity && inPDZone) {
				entries.push({
					price: ob.price,
					type: ob.type,
					strength: ob.strength,
					time: ob.time,
					context: {
						marketStructure: this.marketStructure.trend,
						nearLiquidity,
						inPDZone
					}
				});
			}
		});

		return entries;
	}

	calculateTargets(entryPoint, direction) {
		/**
		 * Calculate potential targets using ICT methodology
		 * @param {Object} entryPoint - Entry point data
		 * @param {string} direction - Trade direction ('long' or 'short')
		 * @returns {Array} - Target levels
		 */
		const targets = [];
		
		// Get relevant FVGs
		const relevantFvgs = this.fairValueGaps.filter(fvg => {
			if (direction === 'long') {
				return fvg.midpoint > entryPoint.price;
			}
			return fvg.midpoint < entryPoint.price;
		});

		// First target: Nearest FVG midpoint
		if (relevantFvgs.length > 0) {
			targets.push({
				price: relevantFvgs[0].midpoint,
				type: 'FVG_MIDPOINT',
				priority: 1
			});
		}

		// Second target: Opposite side of the nearest FVG
		if (relevantFvgs.length > 0) {
			targets.push({
				price: direction === 'long' ? relevantFvgs[0].top : relevantFvgs[0].bottom,
				type: 'FVG_BOUNDARY',
				priority: 2
			});
		}

		// Third target: Next significant structure level
		const nextLevel = this._findNextStructureLevel(entryPoint.price, direction);
		if (nextLevel) {
			targets.push({
				price: nextLevel.price,
				type: 'STRUCTURE_LEVEL',
				priority: 3
			});
		}

		return targets;
	}

	_findOrderBlocks(data) {
		// Implementation to find institutional order blocks
		const orderBlocks = [];
		for (let i = 3; i < data.length; i++) {
			const candles = data.slice(i - 3, i + 1);

			// Look for reversal patterns
			if (this._isReversalPattern(candles)) {
				orderBlocks.push({
					price: candles[0].close,
					type: candles[0].close > candles[3].close ? 'resistance' : 'support',
					strength: this._calculateBlockStrength(candles),
					time: candles[0].time
				});
			}
		}
		return orderBlocks;
	}

	_findLiquidityLevels(data) {
		// Find areas of concentrated liquidity
		const levels = [];
		const volumeThreshold = this._calculateVolumeThreshold(data);
		
		data.forEach((candle, i) => {
			if (candle.volume > volumeThreshold) {
				levels.push({
					price: candle.close,
					volume: candle.volume,
					time: candle.time
				});
			}
		});
		
		return levels;
	}

	_updateMarketStructure(data) {
		// Update swing highs and lows
		const swings = this._findSwingPoints(data);
		this.marketStructure.swing_highs = swings.highs;
		this.marketStructure.swing_lows = swings.lows;
		
		// Determine trend
		this.marketStructure.trend = this._determineTrend(swings);
	}

	_findPremiumDiscountZones(data) {
		const zones = [];
		const atr = this._calculateATR(data);
		
		// Find zones based on market structure
		this.marketStructure.swing_highs.forEach(high => {
			zones.push({
				type: 'premium',
				upper: high + atr,
				lower: high - atr,
				reference: high
			});
		});

		this.marketStructure.swing_lows.forEach(low => {
			zones.push({
				type: 'discount',
				upper: low + atr,
				lower: low - atr,
				reference: low
			});
		});
		
		return zones;
	}

	_findNextStructureLevel(price, direction) {
		const levels = [...this.marketStructure.swing_highs, ...this.marketStructure.swing_lows]
			.map(level => ({ price: level }))
			.sort((a, b) => direction === 'long' ? a.price - b.price : b.price - a.price);
		
		return levels.find(level => 
			direction === 'long' ? level.price > price : level.price < price
		);
	}

	_calculateATR(data, period = 14) {
		// Calculate Average True Range
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

	_findSwingPoints(data) {
		const highs = [];
		const lows = [];
		
		for (let i = 2; i < data.length - 2; i++) {
			// Swing high
			if (data[i].high > data[i-1].high && 
					data[i].high > data[i-2].high &&
					data[i].high > data[i+1].high &&
					data[i].high > data[i+2].high) {
				highs.push(data[i].high);
			}
			
			// Swing low
			if (data[i].low < data[i-1].low &&
					data[i].low < data[i-2].low &&
					data[i].low < data[i+1].low &&
					data[i].low < data[i+2].low) {
				lows.push(data[i].low);
			}
		}
		
		return { highs, lows };
	}

	_determineTrend(swings) {
		const recentHighs = swings.highs.slice(-3);
		const recentLows = swings.lows.slice(-3);
		
		if (recentHighs.every((v, i, a) => !i || v > a[i-1]) &&
				recentLows.every((v, i, a) => !i || v > a[i-1])) {
			return 'uptrend';
		}
		
		if (recentHighs.every((v, i, a) => !i || v < a[i-1]) &&
				recentLows.every((v, i, a) => !i || v < a[i-1])) {
			return 'downtrend';
		}
		
		return 'ranging';
	}

	_isReversalPattern(candles) {
		// Check for potential reversal patterns
		const [c1, c2, c3, c4] = candles;
		
		// Bullish reversal
		if (c1.close < c1.open && // First candle bearish (giam)
				c4.close > c4.open && // Last candle bullish (tang)
				c4.close > c1.close) { // Price increased (tang)
			return true;
		}
		
		// Bearish reversal
		if (c1.close > c1.open && // First candle bullish (tang)
				c4.close < c4.open && // Last candle bearish (giam)
				c4.close < c1.close) { // Price decreased (giam)
			return true;
		}
		
		return false;
	}

	_calculateBlockStrength(candles) {
		// Calculate the strength of an order block based on volume and price movement
		const volumeSum = candles.reduce((sum, c) => sum + c.volume, 0);
		const priceChange = Math.abs(candles[3].close - candles[0].close);
		return (volumeSum * priceChange) / candles.length;
	}

	_calculateVolumeThreshold(data) {
		// Calculate volume threshold based on average volume
		const volumes = data.map(d => d.volume);
		const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
		return avgVolume * 1.5; // 50% above average
	}
}

module.exports = IctAnalyzer;