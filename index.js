// TODO: remove dependency
var EventEmitter = require('events');
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

		if (!value) return;
		if (value instanceof Blob) {
			if (!fd) fd = new FormData();
			fd.append([...keys, key].join('.'), value);
			return;
		}

		var found = objects.find(function (v) { return v === value; });
		if (!found) {
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

var API;
var isDev;
var settings = {
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
		var url = `${settings.secure ? 'https' : 'http'}://${settings.base}/${controller}/${action}`;
		var token = localStorage.getItem('token');
		data = packData(data);

		var xhr = new XMLHttpRequest();
		xhr.open(data ? 'POST' : 'GET', url);
		if (typeof data === 'string') xhr.setRequestHeader('Content-type', 'application/json');
		if (token) xhr.setRequestHeader('Token', token);

		xhr.send(data);
		xhr.onerror = () => {
			resolve({ success: false, code: xhr.status, msg: xhr.statusText || xhr.response || 'NetworkError' });
		};

		xhr.onload = () => {
			var newToken = xhr.getResponseHeader('token');
			if (newToken) localStorage.setItem('token', newToken);
			try { resolve(JSON.parse(xhr.response)); }
			catch { resolve({ success: xhr.status === 200, code: xhr.status, msg: xhr.response }); }
		};
	});
}

var socket = null;
var socketEmitter = new EventEmitter();
socketEmitter.__emit = socketEmitter.emit;
socketEmitter.emit = (...args) => {
	const send = () => socket.send(JSON.stringify(args));
	if (socketEmitter.connection) socketEmitter.connection.then(send);
	else send();
};

socketEmitter.close = () => {
	socketEmitter.removeAllListeners();
	socket.close();
};

function setupSocket () {
	socket = new WebSocket(`${settings.secure ? 'wss' : 'ws'}://${settings.base}/socket`);
	socketEmitter.connection = new Promise(resolve => {
		socket.onopen = () => {
			socket.send('token:' + localStorage.getItem('token'));
			socketEmitter.connection = null;
			resolve();
			socketEmitter.__emit('open');
		};
	});

	socket.onmessage = e => {
		var args = JSON.parse(e.data);
		if (args.event === 'token') localStorage.setItem('token', args.msg);
		socketEmitter.__emit(args.event, args);
	};
	socket.onerror = err => socketEmitter.__emit('error', err);
	socket.onclose = e => {
		socketEmitter.__emit('close', e);
		socket = null;
	};
}

var API = new Proxy({ settings }, {
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

if (module) {
	settings.dev(process.env.NODE_ENV === 'development');
	module.exports = API;
	module.exports.default = module.exports;
} else {
	// Vanilla fallback
	window.API = API;
}
