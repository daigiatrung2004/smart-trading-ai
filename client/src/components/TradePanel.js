import React, { useEffect, useState } from 'react';

const TradePanel = ({ coin, onClose }) => {
	const [trades, setTrades] = useState([]);
	const [status, setStatus] = useState('not-selected');
	const [ws, setWs] = useState(null);

	useEffect(() => {
		if (!coin) {
			setStatus('not-selected');
			if (ws) {
				ws.close();
				setWs(null);
			}
			return;
		}

		// Connect to Binance WebSocket
		const symbol = `${coin.symbol.toLowerCase()}usdt`;
		const newWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
		setWs(newWs);
		setStatus('connecting');

		newWs.onopen = () => {
			setStatus('connected');
			setTrades([]);
		};

		newWs.onmessage = (event) => {
			const tradeData = JSON.parse(event.data);
			setTrades((prevTrades) => {
				const newTrade = {
					price: parseFloat(tradeData.p),
					quantity: parseFloat(tradeData.q),
					time: new Date(tradeData.T).toLocaleTimeString('en-US'),
					isMaker: tradeData.m,
				};
				const updatedTrades = [newTrade, ...prevTrades].slice(0, 50);
				return updatedTrades;
			});
		};

		newWs.onerror = () => {
			setStatus('error');
		};

		return () => {
			if (newWs) {
				newWs.close();
			}
		};
	}, [coin]);

	const getStatusColor = () => {
		switch (status) {
			case 'connected':
				return 'bg-green-500';
			case 'connecting':
				return 'bg-yellow-500 animate-pulse';
			case 'error':
				return 'bg-red-500';
			default:
				return 'bg-gray-400';
		}
	};

	const getStatusText = () => {
		switch (status) {
			case 'connected':
				return 'Live';
			case 'connecting':
				return 'Connecting';
			case 'error':
				return 'Error';
			default:
				return 'Not Selected';
		}
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<div className="flex items-center space-x-3">
					<img
						src={coin ? coin.image : 'https://placehold.co/32x32/e5e7eb/9ca3af?text=?'}
						className="w-8 h-8 rounded-full"
						alt="coin logo"
					/>
					<h2 className="text-xl font-bold text-gray-900">{coin ? coin.name : 'Trades'}</h2>
				</div>
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
						<span className="text-sm text-gray-500 font-medium">{getStatusText()}</span>
					</div>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-800"
						title="Close"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
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
			</div>
			<div className="p-4 flex-grow h-96 lg:h-auto overflow-y-auto">
				<div className="grid grid-cols-3 text-xs font-semibold text-gray-500 mb-2 px-2">
					<span className="text-left">Price (USDT)</span>
					<span className="text-right">Amount</span>
					<span className="text-right">Time</span>
				</div>
				{trades.length === 0 ? (
					<div className="text-center text-gray-400 pt-10">
						{status === 'not-selected'
							? 'Click a coin to see real-time trades.'
							: status === 'connecting'
							? 'Connecting to trade stream...'
							: status === 'error'
							? 'Connection error. Please try again.'
							: 'Waiting for trades...'}
					</div>
				) : (
					<ul className="space-y-1">
						{trades.map((trade, index) => (
							<li
								key={index}
								className={`grid grid-cols-3 text-sm p-1.5 rounded ${
									trade.isMaker ? 'trade-highlight-down' : 'trade-highlight-up'
								}`}
							>
								<span
									className={`font-semibold text-left ${trade.isMaker ? 'price-down' : 'price-up'}`}
								>
									{trade.price.toLocaleString('en-US', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 4,
									})}
								</span>
								<span className="text-right text-gray-700">{trade.quantity.toFixed(4)}</span>
								<span className="text-right text-gray-500">{trade.time}</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default TradePanel;
