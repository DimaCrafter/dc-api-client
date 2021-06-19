const sendAPI = require('./send');
const getSocket = require('./socket');

function thisDefault (ctx, obj, prop, value) {
	if (typeof obj[prop] == 'undefined') ctx[prop] = value;
	else ctx[prop] = obj[prop];
}

let isDev = false;
let API;
class Settings {
	constructor (settings = {}) {
		thisDefault(this, settings, 'base', window.location.hostname);
		thisDefault(this, settings, 'secure', true);
		thisDefault(this, settings, 'reconnectAttempts', 5);
		thisDefault(this, settings, 'reconnectTimeout', 2.5);
	}

	dev (enabled = null) {
		if (enabled === null) return isDev;
		isDev = enabled;
		if (enabled) window.API = API;
	}
}

function wrap (obj) {
	return new Proxy(obj, {
		get (_, controller) {
			if (controller in obj) return obj[controller];
			else if (controller.toLowerCase() == 'socket') {
				return getSocket(obj);
			} else {
				return new Proxy({}, {
					get (_, action) {
						return (data, query) => sendAPI(obj.settings, controller, action, data, query);
					}
				});
			}
		}
	});
}

API = wrap({
	settings: new Settings(),
	post (url, data, newtab = false) {
		var form = document.createElement('form');
		form.method = 'POST';
		form.action = url;
		if (newtab) form.target = '_blank';

		Object.entries(data).forEach(function (pair) {
			var field = document.createElement('input');
			field.name = pair[0];
			field.value = pair[1];
			form.appendChild(field);
		});

		document.body.appendChild(form);
		form.submit();
		form.remove();
	},

	instances: {},
	registerInstance (name, settings) {
		const instance = wrap({ settings: new Settings(settings) });
		this.instances[name] = instance
		return instance;
	}
});

if (typeof module != 'undefined' && (typeof process != 'undefined' || module.id)) {
	API.settings.dev(process.env.NODE_ENV === 'development');
	module.exports = API;
	module.exports.default = module.exports;
} else {
	window.API = API;
}
