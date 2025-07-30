import React, { useState, useEffect, useCallback } from 'react';

const PAIRS = [
	'BTC/USDT',
	'ETH/USDT',
	'BNB/USDT',
	'SOL/USDT',
	'XRP/USDT',
	'ADA/USDT',
	'AVAX/USDT',
	'DOGE/USDT',
	'DOT/USDT',
	'LINK/USDT',
	'MATIC/USDT',
	'UNI/USDT',
];

const SearchBar = ({ onAdd }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [results, setResults] = useState([]);
	const [isVisible, setIsVisible] = useState(false);

	const filterPairs = useCallback(() => {
		if (!searchTerm) {
			setResults([]);
			setIsVisible(false);
			return;
		}

		const filtered = PAIRS.filter((pair) => pair.toLowerCase().includes(searchTerm.toLowerCase()));

		setResults(filtered);
		setIsVisible(filtered.length > 0);
	}, [searchTerm]);

	useEffect(() => {
		filterPairs();
	}, [searchTerm, filterPairs]);

	const handleClickOutside = useCallback((event) => {
		if (!event.target.closest('.search-container')) {
			setIsVisible(false);
		}
	}, []);

	useEffect(() => {
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [handleClickOutside]);

	return (
		<div className="mb-6 relative search-container">
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg
						className="h-5 w-5 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Add trading pair..."
					className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				/>
			</div>

			{isVisible && results.length > 0 && (
				<div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
					{results.map((pair) => (
						<div
							key={pair}
							className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 text-sm"
							onClick={() => {
								onAdd(pair);
								setSearchTerm('');
								setIsVisible(false);
							}}
						>
							{pair}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default SearchBar;
