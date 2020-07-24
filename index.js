function packData (data) {
	if (!data) return null;
	let objects = [],
		stack = [],
		keys = [],
		fd = null;

	const json = JSON.stringify(data, (key, value) => {
		if (!key) {
			objects.push(value);
			return value;
		}

		while (stack.length && stack[0] !== this) {
			stack.shift();
			keys.pop();
		}

		if (value === undefined) return;
		if (value instanceof Blob) {
			if (!fd) fd = new FormData();
			key = keys.join('.') + '.' + key;
			if (key[0] == '.') key = key.slice(1);
			fd.append(key, value);
			return;
		}

		if (!objects.find(v => v === value)) {
			keys.push(key);
			stack.unshift(value);
			objects.push(value);
		}

		return value;
	});

	if (fd) {
		fd.append('json', json);
		return fd;
	} else {
		return json;
	}
}

let API;
let isDev;
const settings = {
	base: window.location.hostname,
	secure: true,
	dev: function (enabled = null) {
		if (enabled === null) return isDev;
		isDev = enabled;
		if (enabled) window.API = API;
	},

	reconnectAttempts: 5,
	reconnectTimeout: 2.5
};

function sendAPI (controller, action, data = null, query = null) {
	return new Promise(resolve => {
		var xhr = new XMLHttpRequest();
		data = packData(data);
		
		if (query) {
			query = '?' + Object.entries(query).map(entry => entry[0] + '=' + entry[1]).join('&');
		} else {
			query = '';
		}

		xhr.open(data ? 'POST' : 'GET', `${settings.secure ? 'https' : 'http'}://${settings.base}/${controller}/${action}${query}`);
		if (typeof data == 'string') xhr.setRequestHeader('Content-type', 'application/json');

		let session = localStorage.getItem('session');
		if (session) xhr.setRequestHeader('Session', session);

		xhr.send(data);
		xhr.onerror = () => {
			resolve({ success: false, code: xhr.status, msg: xhr.statusText || xhr.response || 'NetworkError' });
		};

		xhr.onload = () => {
			session = xhr.getResponseHeader('session');
			if (session) localStorage.setItem('session', session);

			switch (xhr.getResponseHeader('content-type')) {
				case 'application/json':
					try { resolve({ success: xhr.status == 200, code: xhr.status, msg: JSON.parse(xhr.response) }); }
					catch (err) { resolve({ success: false, code: -1, msg: err }); }
					break;
				default:
					resolve({ success: xhr.status == 200, code: xhr.status, msg: xhr.response });
					break;
			}
		};
	});
}

var socket = null;
var socketEmitter = {
	_events: {},
	_dispatch (event, args) {
		const listeners = this._events[event];
		if (listeners) {
			for (let i = 0; i < listeners.length; i++) {
				listeners[i].apply(null, args);
				if (listeners[i].once) listeners.splice(i, 1);
			}
		}
	},

	on: function (event, listener) {
		if (this._events[event]) this._events[event].push(listener);
		else this._events[event] = [listener];
	},
	once: function (event, listener) {
		listener.once = true;
		this.on(event, listener);
	},
	off: function (event, listener) {
		const listeners = this._events[event];
		if (listeners) {
			var i = listeners.findIndex(l => l === listener);
			if (~i) listeners.splice(i, 1);
		}
	},
	emit: function () {
		let args = [];
		for (let i = 0; i < arguments.length; i++) args[i] = arguments[i];

		const send = () => socket.send(JSON.stringify(args));
		if (socketEmitter.connection) socketEmitter.connection.then(send);
		else send();
	},
	close: function () {
		this._events = {};
		socket.close();
	}
};

function setupSocket (attempts = 0) {
	socket = new WebSocket(`${settings.secure ? 'wss' : 'ws'}://${settings.base}/socket`);
	socketEmitter.connection = new Promise(resolve => {
		socket.onopen = () => {
			socket.send('session:' + localStorage.getItem('session'));
			socketEmitter.connection = null;
			resolve();
			socketEmitter._dispatch('open', [attempts > 0]);
			attempts = 0;
		};
	});

	socket.onmessage = e => {
		var args = JSON.parse(e.data);
		if (args[0] == 'session') localStorage.setItem('session', args[1]);
		socketEmitter._dispatch(args[0], args.slice(1));
	};

	socket.onclose = e => {
		if (settings.reconnectAttempts != -1 && attempts == settings.reconnectAttempts) {
			socketEmitter._dispatch('close', [e.code, e.reason]);
			socket = null;
		} else {
			socketEmitter._dispatch('reconnect', [attempts + 1]);
			setTimeout(() => setupSocket(++attempts), settings.reconnectTimeout * 1000);
		}
	};
}

function post (url, data, newtab = false) {
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
}

API = new Proxy({ settings, post, send: sendAPI }, {
	get (obj, controller) {
		if (controller in obj) return obj[controller];
		else if (controller.toLowerCase() == 'socket') {
			if (!socket) setupSocket();
			return socketEmitter;
		} else {
			return new Proxy({}, {
				get (obj, action) {
					return (data, query) => sendAPI(controller, action, data, query);
				}
			});
		}
	}
});

if (typeof module != 'undefined') {
	settings.dev(process.env.NODE_ENV === 'development');
	module.exports = API;
	module.exports.default = module.exports;
} else {
	// Vanilla fallback
	window.API = API;
}
