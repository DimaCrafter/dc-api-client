class SocketEmitter {
	constructor (API) {
		this._events = {};
		this._connection = null;
		this.socket = null;

		const connect = attempts => {
			this._socket = new WebSocket(`${API.settings.secure ? 'wss' : 'ws'}://${API.settings.base}/socket`);
			this._connection = new Promise(resolve => {
				this._socket.onopen = () => {
					this._socket.send('session:' + localStorage.getItem('session'));
					this._connection = null;
					resolve();
					this._dispatch('open', [attempts > 0]);
					attempts = 0;
				};
			});
	
			this._socket.onmessage = e => {
				var args = JSON.parse(e.data);
				if (args[0] == 'session') localStorage.setItem('session', args[1]);
				this._dispatch(args[0], args.slice(1));
			};
	
			this._socket.onclose = e => {
				if (this._socket._disableReconnect || API.settings.reconnectAttempts != -1 && attempts == API.settings.reconnectAttempts) {
					this._dispatch('close', [e.code, e.reason]);
					this._socket = null;
				} else {
					this._dispatch('reconnect', [attempts + 1]);
					setTimeout(() => connect(++attempts), API.settings.reconnectTimeout * 1000);
				}
			};
		};

		connect(0);
	}

	_dispatch (event, args) {
		const listeners = this._events[event];
		if (listeners) {
			for (let i = 0; i < listeners.length; i++) {
				listeners[i].apply(null, args);
				if (listeners[i].once) listeners.splice(i, 1);
			}
		}
	}

	on (event, listener) {
		if (this._events[event]) this._events[event].push(listener);
		else this._events[event] = [listener];
	}

	once (event, listener) {
		listener.once = true;
		this.on(event, listener);
	}

	off (event, listener) {
		const listeners = this._events[event];
		if (listeners) {
			var i = listeners.findIndex(l => l === listener);
			if (~i) listeners.splice(i, 1);
		}
	}

	emit () {
		let args = [];
		for (let i = 0; i < arguments.length; i++) args[i] = arguments[i];

		const send = () => this._socket.send(JSON.stringify(args));
		if (this._connection) this._connection.then(send);
		else send();
	}

	close () {
		this._socket._disableReconnect = true;
		this._socket.close();
		this._dispatch('close', [0, 'ManualClose']);
		this._events = {};
	}
}

module.exports = API => {
	if (!API._socketEmitter) {
		API._socketEmitter = new SocketEmitter(API);
		API._socketEmitter.on('close', () => {
			API._socketEmitter = null;
		});
	}

	return API._socketEmitter;
};
