import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import PriceWatchlist from './components/PriceWatchlist';
import MarketIndicators from './components/MarketIndicators';
import SignalPanel from './components/SignalPanel';
import TradingView from './components/TradingView';
import useNotifications from './components/useNotifications';

function App() {
	const [signal, setSignal] = useState(null);
	const [connected, setConnected] = useState(false);
	const [selectedPair, setSelectedPair] = useState('BTC/USDT');
	const [timeframe, setTimeframe] = useState('1h');
	const ws = useRef(null);
	const reconnectTimeout = useRef(null);
	const { showNotification } = useNotifications();

	const connectWebSocket = () => {
		if (ws.current?.readyState === WebSocket.OPEN) return;

		ws.current = new WebSocket('ws://localhost:4000');

		ws.current.onopen = () => {
			console.log('Connected to server');
			setConnected(true);
			if (ws.current?.readyState === WebSocket.OPEN) {
				ws.current.send(
					JSON.stringify({
						type: 'subscribe',
						symbol: selectedPair,
						timeframe: timeframe,
					})
				);
			}
		};

		ws.current.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'signal') {
					setSignal(data.signal);
					showNotification('New Trading Signal', `${data.signal.type} signal for ${data.signal.pair}`);
				}
			} catch (error) {
				console.error('Error parsing message:', error);
			}
		};

		ws.current.onclose = () => {
			console.log('Disconnected from server');
			setConnected(false);
			reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
		};
	};

	useEffect(() => {
		connectWebSocket();
		return () => {
			if (ws.current) {
				ws.current.close();
			}
			if (reconnectTimeout.current) {
				clearTimeout(reconnectTimeout.current);
			}
		};
	}, [selectedPair, timeframe]);

	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
			<div className="container mx-auto px-4 py-8">
				<header className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Trading AI</h1>
					<div className="mt-2 flex items-center space-x-2">
						<div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
						<span className="text-sm text-gray-600 dark:text-gray-400">
							{connected ? 'Connected to server' : 'Disconnected'}
						</span>
					</div>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div className="lg:col-span-8">
						<TradingView pair={selectedPair} />
						<MarketIndicators />
					</div>

					<div className="lg:col-span-4 space-y-6">
						<PriceWatchlist
							onPairSelect={setSelectedPair}
							selectedPair={selectedPair}
							onTimeframeChange={setTimeframe}
							selectedTimeframe={timeframe}
						/>
						{signal && <SignalPanel signals={[signal]} />}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
