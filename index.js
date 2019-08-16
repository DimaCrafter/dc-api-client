import { EventEmitter } from 'events';
function packData (data) {
	if (!data) return null;
  	let objects = [],
		stack = [],
		keys = [],
		fd = null;

	const json = JSON.stringify(data, function(key, value) {
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

		let found = objects.find(v => v === value);
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

let settings = {
	base: window.location.hostname,
	secure: true
};

function sendAPI (controller, action, data = null) {
	return new Promise(resolve => {
		const url = `${settings.secure ? 'https' : 'http'}://${settings.base}/${controller}/${action}`;
		const token = localStorage.getItem('token');
		data = packData(data);

		const xhr = new XMLHttpRequest();
		xhr.open(data ? 'POST' : 'GET', url);
		typeof data === 'string' && xhr.setRequestHeader('Content-type', 'application/json');
		token && xhr.setRequestHeader('Token', token);

		xhr.send(data);
		xhr.onerror = () => {
			resolve({ success: false, code: xhr.status, msg: xhr.statusText || xhr.response || 'NetworkError' });
		};
		xhr.onload = () => {
			const newToken = xhr.getResponseHeader('token');
			if (newToken) localStorage.setItem('token', newToken);
			try { resolve(JSON.parse(xhr.response)); }
			catch { resolve({ success: xhr.status === 200, code: xhr.status, msg: xhr.response});  }
		};
	});
}

let socket = null;
let socketEmitter = new EventEmitter();
socketEmitter.__emit = socketEmitter.emit;
socketEmitter.emit = (...args) => socket.send(JSON.stringify(args));
socketEmitter.close = () => {
	socketEmitter.removeAllListeners();
	socket.close();
};

function setupSocket () {
	socket = new WebSocket(`${settings.secure ? 'wss' : 'ws'}://${settings.base}/socket`);
	socket.onopen = () => {
		socket.send('token:' + localStorage.getItem('token'));
		socketEmitter.__emit('open');
	};
	socket.onmessage = e => {
		const args = JSON.parse(e.data);
		if (args.event === 'token') localStorage.setItem('token', args.msg);
		socketEmitter.__emit(args.event, args);
	};
	socket.onerror = err => socketEmitter.__emit('error', err);
	socket.onclose = e => {
		socketEmitter.__emit('close', e);
		socket = null;
	};
}

export default new Proxy({ settings }, {
	get (obj, controller) {
		if (controller in obj) return obj[controller];
		else if (controller == 'socket') {
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
