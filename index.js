// This file for regular usage
const API = require('./api');

let isDev = process.env.NODE_ENV === 'development';
API.settings.dev = (enabled = null) => {
	if (enabled === null) return isDev;
	isDev = enabled;
	if (enabled) window.API = API;
};

module.exports.default = module.exports = API;
