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
	}
};

function sendAPI (controller, action, data = null) {
	return new Promise(resolve => {
		var xhr = new XMLHttpRequest();
		data = packData(data);
		xhr.open(data ? 'POST' : 'GET', `${settings.secure ? 'https' : 'http'}://${settings.base}/${controller}/${action}`);
		if (typeof data == 'string') xhr.setRequestHeader('Content-type', 'application/json');

		let token = localStorage.getItem('token');
		if (token) xhr.setRequestHeader('Token', token);

		xhr.send(data);
		xhr.onerror = () => {
			resolve({ success: false, code: xhr.status, msg: xhr.statusText || xhr.response || 'NetworkError' });
		};

		xhr.onload = () => {
			token = xhr.getResponseHeader('token');
			if (token) localStorage.setItem('token', token);

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

function setupSocket () {
	socket = new WebSocket(`${settings.secure ? 'wss' : 'ws'}://${settings.base}/socket`);
	socketEmitter.connection = new Promise(resolve => {
		socket.onopen = () => {
			socket.send('token:' + localStorage.getItem('token'));
			socketEmitter.connection = null;
			resolve();
			socketEmitter._dispatch('open');
		};
	});

	socket.onmessage = e => {
		var args = JSON.parse(e.data);
		if (args[0] == 'token') localStorage.setItem('token', args[1]);
		socketEmitter._dispatch(args[0], args.slice(1));
	};

	socket.onerror = err => socketEmitter._dispatch('error', [err]);
	socket.onclose = e => {
		socketEmitter._dispatch('close', [e]);
		socket = null;
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
					return data => sendAPI(controller, action, data);
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
