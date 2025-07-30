const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const SignalGenerator = require('./trading/SignalGenerator');
const signalGenerator = new SignalGenerator();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection handling
wss.on('connection', async (ws) => {
	console.log('New client connected');

	// Cleanup function
	const cleanup = () => {
		if (ws.updateInterval) {
			clearInterval(ws.updateInterval);
		}
	};

	// Handle client disconnect
	ws.on('close', () => {
		console.log('Client disconnected');
		cleanup();
	});
	ws.on('message', async (message) => {
		try {
			const data = JSON.parse(message);
			switch (data.type) {
				case 'subscribe':
					console.log(`Client subscribed to ${data.symbol} on ${data.timeframe} timeframe`);
					ws.symbol = data.symbol;
					ws.timeframe = data.timeframe;

					// Initialize SignalGenerator with the new symbol and timeframe
					const initialized = await signalGenerator.init(data.symbol, data.timeframe);
					if (!initialized) {
						ws.send(
							JSON.stringify({
								type: 'error',
								message: 'Failed to initialize market data',
							})
						);
						return;
					}

					// Start sending periodic updates
					const sendUpdate = async () => {
						try {
							const analysis = await signalGenerator.analyzeMarket();
							if (analysis) {
								ws.send(
									JSON.stringify({
										type: 'marketUpdate',
										marketData: signalGenerator.marketData[signalGenerator.marketData.length - 1],
										analysis: analysis,
									})
								);
							}
						} catch (error) {
							console.error('Error sending market update:', error);
							ws.send(
								JSON.stringify({
									type: 'error',
									message: 'Error analyzing market data',
								})
							);
						}
					};

					// Send updates every minute
					ws.updateInterval = setInterval(sendUpdate, 60000);
					// Send initial update
					await sendUpdate();
					break;

				default:
					console.log('Unknown message type:', data.type);
			}
		} catch (error) {
			console.error('Error processing message:', error);
		}
	});
});

// REST API endpoints
app.get('/api/market-structure', async (req, res) => {
	try {
		if (!signalGenerator.marketData || signalGenerator.marketData.length === 0) {
			throw new Error('No market data available');
		}
		const structure = await signalGenerator.smc.detectMarketStructure(signalGenerator.marketData);
		res.json(structure);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/signals', async (req, res) => {
	try {
		if (!signalGenerator.marketData || signalGenerator.marketData.length === 0) {
			throw new Error('No market data available');
		}
		const signals = await signalGenerator.generateSignals(signalGenerator.marketData);
		res.json(signals);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
