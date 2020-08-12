function packData (data) {
	if (!data) return null;
	let objects = [],
		stack = [],
		keys = [],
		formData = null;

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
			if (!formData) formData = new FormData();
			key = keys.join('.') + '.' + key;

			if (key[0] == '.') key = key.slice(1);
			formData.append(key, value);

			return;
		}

		if (!objects.find(v => v === value)) {
			keys.push(key);
			stack.unshift(value);
			objects.push(value);
		}

		return value;
	});

	if (formData) {
		formData.append('json', json);
		return formData;
	} else {
		return json;
	}
}

module.exports = function (settings, controller, action, data = null, query = null) {
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
