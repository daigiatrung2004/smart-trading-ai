import React, { useState, useEffect } from 'react';

const MarketIndicators = () => {
	const [marketData, setMarketData] = useState({
		btcDominance: null,
		total3: null,
		loading: true,
		error: null,
	});

	const formatNumber = (num) => {
		if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		return num.toFixed(2);
	};

	useEffect(() => {
		const fetchMarketIndicators = async () => {
			try {
				setMarketData((prev) => ({ ...prev, loading: true, error: null }));

				const response = await fetch('https://api.coingecko.com/api/v3/global');
				if (!response.ok) throw new Error(`API Error: ${response.status}`);

				const globalData = await response.json();
				const data = globalData.data;

				const btcDominance = data.market_cap_percentage.btc;
				const totalMarketCap = data.total_market_cap.usd;
				const btcMarketCap = totalMarketCap * (data.market_cap_percentage.btc / 100);
				const ethMarketCap = totalMarketCap * (data.market_cap_percentage.eth / 100);
				const total3 = totalMarketCap - btcMarketCap - ethMarketCap;

				setMarketData({
					btcDominance: btcDominance.toFixed(2),
					total3: formatNumber(total3),
					loading: false,
					error: null,
				});
			} catch (error) {
				console.error('Error fetching market indicators:', error);
				setMarketData((prev) => ({
					...prev,
					loading: false,
					error: error.message,
				}));
			}
		};

		fetchMarketIndicators();
		const interval = setInterval(fetchMarketIndicators, 90000);
		return () => clearInterval(interval);
	}, []);

	if (marketData.loading) {
		return (
			<div className="mb-6 grid grid-cols-2 gap-4 animate-pulse">
				<div className="bg-gray-100 rounded-lg h-24"></div>
				<div className="bg-gray-100 rounded-lg h-24"></div>
			</div>
		);
	}

	if (marketData.error) {
		return (
			<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
				<p className="text-red-600">Failed to load market data: {marketData.error}</p>
			</div>
		);
	}

	return (
		<div className="mb-6 grid grid-cols-2 gap-4">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all hover:shadow-md">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<img
							src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
							className="w-6 h-6 rounded-full"
							alt="BTC"
							loading="lazy"
						/>
						<h3 className="font-semibold text-gray-700 dark:text-gray-200">BTC Dominance</h3>
					</div>
					<div className="text-xl font-bold text-gray-900 dark:text-gray-100">
						{marketData.btcDominance ? `${marketData.btcDominance}%` : '...'}
					</div>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all hover:shadow-md">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<svg
							className="w-6 h-6 text-gray-600 dark:text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
							/>
						</svg>
						<h3 className="font-semibold text-gray-700 dark:text-gray-200">Altcoin Market Cap</h3>
					</div>
					<div className="text-xl font-bold text-gray-900 dark:text-gray-100">
						{marketData.total3 ? `$${marketData.total3}` : '...'}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MarketIndicators;
