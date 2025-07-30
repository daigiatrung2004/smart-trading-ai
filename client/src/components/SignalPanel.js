import React from 'react';

const SignalPanel = ({ signals }) => {
	return (
		<div className="bg-white rounded-lg shadow-sm p-4 mt-4">
			<h2 className="text-xl font-bold text-gray-900 mb-4">Trading Signals</h2>
			<div className="space-y-4">
				{signals &&
					signals.map((signal, index) => (
						<div
							key={index}
							className="border-b border-gray-200 pb-4 last:border-b-0"
						>
							<div
								className={`flex items-center space-x-2 ${
									signal.direction === 'long' ? 'text-green-600' : 'text-red-600'
								}`}
							>
								<span className="text-lg font-semibold">
									{signal.type} {signal.direction.toUpperCase()}
								</span>
							</div>
							<div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-600">
								<div>
									<span className="font-medium">Entry:</span> ${signal.entry}
								</div>
								<div>
									<span className="font-medium">Stop:</span> ${signal.stopLoss}
								</div>
								<div>
									<span className="font-medium">Target:</span> ${signal.target}
								</div>
							</div>
							<div className="mt-2 text-sm">
								<span className="font-medium text-gray-700">Risk/Reward:</span>
								<span className="ml-2 text-blue-600">{signal.riskRewardRatio}</span>
							</div>
							<div className="mt-2 text-xs text-gray-500">
								{new Date(signal.timestamp).toLocaleString()}
							</div>
						</div>
					))}
			</div>
		</div>
	);
};

export default SignalPanel;
