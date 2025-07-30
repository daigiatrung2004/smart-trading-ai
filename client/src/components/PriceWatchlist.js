import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from './SearchBar';

const DEFAULT_PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'];
const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

const PriceWatchlist = ({ onPairSelect, selectedPair, onTimeframeChange, selectedTimeframe }) => {
	const [watchlist, setWatchlist] = useState([]);
	const [prices, setPrices] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const loadSavedWatchlist = () => {
			const saved = localStorage.getItem('trading-watchlist');
			return saved ? JSON.parse(saved) : DEFAULT_PAIRS;
		};

		setWatchlist(loadSavedWatchlist());
	}, []);

	useEffect(() => {
		const connectWebSocket = () => {
			const ws = new WebSocket('ws://localhost:4000/prices');

			ws.onopen = () => {
				watchlist.forEach((pair) => {
					ws.send(JSON.stringify({ type: 'subscribe', pair }));
				});
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === 'price') {
						setPrices((prev) => ({
							...prev,
							[data.pair]: {
								price: data.price,
								change24h: data.change24h,
								volume: data.volume,
							},
						}));
					}
				} catch (error) {
					console.error('WebSocket message error:', error);
				}
			};

			ws.onerror = (error) => {
				setError('Failed to connect to price feed');
				console.error('WebSocket error:', error);
			};

			return ws;
		};

		const ws = connectWebSocket();
		return () => ws.close();
	}, [watchlist]);

	const addToWatchlist = useCallback(
		(pair) => {
			if (!watchlist.includes(pair)) {
				const newWatchlist = [...watchlist, pair];
				setWatchlist(newWatchlist);
				localStorage.setItem('trading-watchlist', JSON.stringify(newWatchlist));
			}
		},
		[watchlist]
	);

	const removeFromWatchlist = useCallback(
		(pair) => {
			const newWatchlist = watchlist.filter((p) => p !== pair);
			setWatchlist(newWatchlist);
			localStorage.setItem('trading-watchlist', JSON.stringify(newWatchlist));
		},
		[watchlist]
	);
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
			<div className="mb-4">
				<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Market Watch</h2>
				<div className="flex space-x-2 mb-4">
					{TIMEFRAMES.map((tf) => (
						<button
							key={tf}
							onClick={() => onTimeframeChange(tf)}
							className={`px-3 py-1 text-sm rounded-lg transition-colors ${
								selectedTimeframe === tf
									? 'bg-primary-500 text-white'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
							}`}
						>
							{tf}
						</button>
					))}
				</div>
				<SearchBar onAdd={addToWatchlist} />
			</div>

			{error ? (
				<div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
					{error}
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead className="bg-gray-50 dark:bg-gray-900/50">
							<tr>
								<th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Pair
								</th>
								<th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Price
								</th>
								<th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									24h Change
								</th>
								<th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Volume
								</th>
								<th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
							{watchlist.map((pair) => {
								const data = prices[pair] || {};
								const change = parseFloat(data.change24h);
								return (
									<tr
										key={pair}
										className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
											selectedPair === pair ? 'bg-primary-50 dark:bg-primary-900/20' : ''
										}`}
										onClick={() => onPairSelect(pair)}
									>
										<td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-100">{pair}</td>
										<td className="px-3 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
											$
											{data.price?.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 8,
											}) || '—'}
										</td>
										<td
											className={`px-3 py-4 text-sm text-right ${
												!change
													? 'text-gray-500 dark:text-gray-400'
													: change > 0
													? 'text-green-600 dark:text-green-400'
													: 'text-red-600 dark:text-red-400'
											}`}
										>
											{change ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
										</td>
										<td className="px-3 py-4 text-sm text-right text-gray-500 dark:text-gray-400">
											$
											{data.volume?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ||
												'—'}
										</td>
										<td className="px-3 py-4 text-right">
											<button
												onClick={(e) => {
													e.stopPropagation();
													removeFromWatchlist(pair);
												}}
												className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default PriceWatchlist;
