import React from 'react';
import { createChart } from 'lightweight-charts';

class TradingView extends React.Component {
    chartRef = React.createRef();
    
    componentDidMount() {
        const chart = createChart(this.chartRef.current, {
            width: 800,
            height: 400,
            layout: {
                backgroundColor: '#253248',
                textColor: 'rgba(255, 255, 255, 0.9)',
            },
            grid: {
                vertLines: {
                    color: 'rgba(197, 203, 206, 0.5)',
                },
                horzLines: {
                    color: 'rgba(197, 203, 206, 0.5)',
                },
            },
            priceScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#4CAF50',
            downColor: '#FF5252',
            borderDownColor: '#FF5252',
            borderUpColor: '#4CAF50',
            wickDownColor: '#FF5252',
            wickUpColor: '#4CAF50',
        });

        // Example data
        candlestickSeries.setData([
            { time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
            { time: '2018-12-23', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
            { time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
            { time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
            { time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
        ]);

        chart.timeScale().fitContent();
    }

    render() {
        return <div ref={this.chartRef} />;
    }
}

export default TradingView;