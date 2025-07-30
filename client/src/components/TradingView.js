import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const TradingView = ({ data = [], pair = 'BTC/USDT' }) => {
	const chartRef = useRef();
	const chartInstance = useRef(null);

	useEffect(() => {
		if (!chartRef.current) return;

		const chart = createChart(chartRef.current, {
			width: chartRef.current.clientWidth,
			height: 400,
			layout: {
				background: { color: '#1a1a1a' },
				textColor: '#d1d5db',
			},
			grid: {
				vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
				horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
			},
			rightPriceScale: {
				borderVisible: false,
			},
			timeScale: {
				borderVisible: false,
				timeVisible: true,
				secondsVisible: false,
			},
			crosshair: {
				vertLine: {
					color: '#555',
					width: 0.5,
					style: 1,
					visible: true,
					labelVisible: true,
				},
				horzLine: {
					color: '#555',
					width: 0.5,
					style: 1,
					visible: true,
					labelVisible: true,
				},
			},
		});

		const candlestickSeries = chart.addCandlestickSeries({
			upColor: '#22c55e',
			downColor: '#ef4444',
			borderUpColor: '#22c55e',
			borderDownColor: '#ef4444',
			wickUpColor: '#22c55e',
			wickDownColor: '#ef4444',
		});

		if (data.length > 0) {
			candlestickSeries.setData(data);
			chart.timeScale().fitContent();
		}

		chartInstance.current = chart;

		const handleResize = () => {
			chart.applyOptions({
				width: chartRef.current.clientWidth,
			});
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			chart.remove();
		};
	}, [data]);

	return (
		<div className="bg-gray-900 rounded-lg p-4">
			<h3 className="text-lg font-semibold text-gray-100 mb-4">{pair} Chart</h3>
			<div
				ref={chartRef}
				className="w-full"
			/>
		</div>
	);
};

export default TradingView;
