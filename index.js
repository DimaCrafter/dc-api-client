// This file for regular usage, non-browser environments not supported
if (typeof window !== 'undefined') {
	const API = require('./api');

	let isDev;
	API.settings.dev = (enabled = null) => {
		if (enabled === null) return isDev;

		isDev = enabled;
		if (enabled) window.API = API;
	};

	API.settings.dev(process.env.NODE_ENV === 'development');

	module.exports = API;
}
