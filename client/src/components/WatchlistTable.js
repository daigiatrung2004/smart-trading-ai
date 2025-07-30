import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const WatchlistTable = ({ watchlist, coinDataCache, onRemoveCoin, onSelectCoin }) => {
	const chartRefs = useRef({});

	const fetchAndRenderChart = async (coinId) => {
		if (!chartRefs.current[coinId]) return;

		try {
			const response = await fetch(
				`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`
			);
			if (!response.ok) throw new Error(`API Error: ${response.status}`);

			const data = await response.json();
			const chartData = data.prices.map((price) => ({
				time: price[0] / 1000,
				value: price[1],
			}));

			const container = chartRefs.current[coinId];
			const chart = createChart(container, {
				width: container.clientWidth,
				height: container.clientHeight,
				layout: { backgroundColor: 'transparent' },
				grid: { vertLines: { visible: false }, horzLines: { visible: false } },
				rightPriceScale: { visible: false },
				timeScale: { visible: false },
				handleScroll: false,
				handleScale: false,
			});

			const areaSeries = chart.addAreaSeries({ lineWidth: 2 });
			const firstPrice = chartData[0].value;
			const lastPrice = chartData[chartData.length - 1].value;
			const colorUp = {
				topColor: 'rgba(22, 163, 74, 0.1)',
				bottomColor: 'rgba(22, 163, 74, 0)',
				lineColor: '#16A34A',
			};
			const colorDown = {
				topColor: 'rgba(220, 38, 38, 0.1)',
				bottomColor: 'rgba(220, 38, 38, 0)',
				lineColor: '#DC2626',
			};

			areaSeries.applyOptions(lastPrice >= firstPrice ? colorUp : colorDown);
			areaSeries.setData(chartData);

			return () => chart.remove();
		} catch (error) {
			console.error(`Error fetching chart data for ${coinId}:`, error);
		}
	};

	useEffect(() => {
		watchlist.forEach((coinId) => {
			fetchAndRenderChart(coinId);
		});
	}, [watchlist]);

	const renderPrice = (price) => {
		return `$${price.toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 6,
		})}`;
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
			<div className="px-6 py-4 grid grid-cols-12 gap-4 border-b border-gray-200">
				<div className="col-span-4 font-semibold text-gray-600 text-sm">Name</div>
				<div className="col-span-2 text-right font-semibold text-gray-600 text-sm">Price</div>
				<div className="col-span-2 text-right font-semibold text-gray-600 text-sm">Change %</div>
				<div className="col-span-2 text-right font-semibold text-gray-600 text-sm">Change</div>
				<div className="col-span-2 text-center font-semibold text-gray-600 text-sm">Chart (7d)</div>
			</div>

			<div id="watchlistContainer">
				{watchlist.length === 0 ? (
					<div className="text-center py-16 text-gray-500">
						<p>Your watchlist is empty.</p>
						<p className="mt-2 text-sm">Use the search bar above to add price.</p>
					</div>
				) : (
					watchlist.map((coinId) => {
						const coin = coinDataCache[coinId];
						if (!coin) return null;

						const changePercent = coin.price_change_percentage_24h || 0;
						const changeValue = coin.price_change_24h || 0;
						const colorClass = changePercent >= 0 ? 'price-up' : 'price-down';

						return (
							<div
								key={coinId}
								className="watchlist-row group relative grid grid-cols-12 gap-4 items-center px-6 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
								onClick={() => onSelectCoin(coinId)}
							>
								<div className="col-span-4 flex items-center space-x-3">
									<img
										src={coin.image}
										className="w-8 h-8 rounded-full"
										alt={`${coin.name} logo`}
									/>
									<div>
										<p className="font-bold text-gray-900 uppercase">{coin.symbol}</p>
										<p className="text-sm text-gray-500 capitalize">{coin.name}</p>
									</div>
								</div>
								<div className="col-span-2 text-right font-semibold">
									{renderPrice(coin.current_price)}
								</div>
								<div className={`col-span-2 text-right font-medium ${colorClass}`}>
									{`${changePercent.toFixed(2)}%`}
								</div>
								<div className={`col-span-2 text-right font-medium ${colorClass}`}>
									{renderPrice(Math.abs(changeValue))}
								</div>
								<div className="col-span-2 flex justify-center items-center">
									<div
										ref={(el) => (chartRefs.current[coinId] = el)}
										className="w-full h-10"
									></div>
								</div>
								<button
									className="remove-btn absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={(e) => {
										e.stopPropagation();
										onRemoveCoin(coinId);
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<line
											x1="18"
											y1="6"
											x2="6"
											y2="18"
										></line>
										<line
											x1="6"
											y1="6"
											x2="18"
											y2="18"
										></line>
									</svg>
								</button>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default WatchlistTable;
