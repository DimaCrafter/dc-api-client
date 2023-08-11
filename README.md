# HTTP API client

Primary designed for [dc-api-core](https://github.com/DimaCrafter/dc-api-core).

[![NPM](https://nodei.co/npm/dc-api-client.png)](https://npmjs.com/package/dc-api-client)

## Basic usage

### Import dc-api-client to your project

```js
// Use Node.JS require
const API = require('dc-api-client');
// OR use import for ES6+/TS
import API from 'dc-api-client'
```

### Make request to backend

```js
const res = await API.Controller.action({
    // Any JSON-compatible types are supported.
    // You can also use Blob or File as the value.
});
```

* `Controller` - your controller name
* `action` - your action name in controller
* `res` - Response object

### Response object

| Name    | Type      | Note                                                                          |
|---------|-----------|-------------------------------------------------------------------------------|
| success | `Boolean` | `true` if response code is `200`                                              |
| code    | `Number`  | HTTP response code                                                            |
| msg     | `any`     | If backend returned JSON, it will be parsed, otherwise contains raw response. |

### Example

Sending user data to `register` method in `Auth` controller.

```js
const API = require('dc-api-client');
const res = await API.Auth.register({
    email: 'test@best.mail',
    password: '123123'
});
console.log(res);
```

Example console output:

```js
{
    success: true,
    code: 200,
    msg: {
        status: 'user_registered',
        id: 42
    }
}
```

### Sending request with query string

```js
API.TestController.action(null, { query: 'works' });
// useKebab = false:    GET /TestController/action?query=works
// useKebab = true:     GET /test-controller/action?query=works
```

## Settings

Settings stored in `API.settings` object.

| Field             | Type     | Default             | Note                                                              |
|-------------------|----------|---------------------|-------------------------------------------------------------------|
| secure            | boolean  | `true`              | `true` - use HTTPS, instead of HTTP                               |
| base              | string   | `location.hostname` | Hostname with prefix path                                         |
| dev               | Function | Read-only           | Enables or disables dev mode as setter, returns boolean as getter |
| reconnectAttempts | number   | 5                   | Count of WebSocket reconnection attempts, `-1` is ∞               |
| reconnectTimeout  | number   | 2.5                 | WebSocket reconnection timeout is seconds                         |
| useKebab          | boolean  | `false`             | `true` - automatically transform names to kebab-case              |
| followRedirects   | boolean  | `true`              | `true` - automatically redirect if "Location" header present      |

### Settings example #1

```js
const API = require('dc-api-client');

// Redundant, because HTTPS enabled by default
API.settings.secure = true;
API.settings.base = 'your-domain.com:8080/api';
```

Where `your-domain.com` is your domain or IP address.

### Settings example #2

```js
import API from 'dc-api-client';

API.settings.secure = false;
API.settings.base = `${location.hostname}:8080/api`;
```

## Socket controller

WebSockets connection will be initialized when controller used for first time.

WS URI: `ws[s]://<settings.base>/socket`

```js
API.Socket: {
    // Calling <event> method in Socket controller on back-end
    emit (event: String, ...arguments: any[]);

    // Sets trigger for <event> reply
    on (event: String, listener: (...arguments: any[]) => {});

    // Sets one time trigger for <event> reply
    once (event: String, listener: (...arguments: any[]) => {});

    // Removing trigger for <event>
    off (event: String, listener: (...arguments: any[]) => {});
};
```

### Socket events

```js
API.Socket.on('open', isReconnect => {
    if (isReconnect) console.log('Reconnected!');
    else console.log('Connected for first time');
});

API.Socket.on('reconnect', attempt => {
    // This event will be fired BEFORE reconnection
    if (API.settings.reconnectAttempts == -1) console.log(`[${attempt}/∞] Reconnecting...`);
    else console.log(`[${attempt}/${API.settings.reconnectAttempts}] Reconnecting...`);
});

API.Socket.on('close', (code, reason) => {
    // Reconnection never trigger this event,
    // i.e. on full connection lost
    console.log(`Connection was closed with code ${code}: ${reason || 'No reason provided'}`);
    // e - CloseEvent object (browser event)
});

API.Socket.on('<custom-event-name>', (a, b) => {
    // Handles event emitted from the server
    // For example, with dc-api-core you can use this line to emit your event
    //     this.emit('<custom-event-name>', 7, 5);
    // which will send packet below
    //     ["<custom-event-name>",7,5]
    // and will be handled here by dc-api-client
    console.log('New <custom-event-name> data!', a, b);
});
```

## Advanced features

### Multiple API connections

main.js:

```js
import API from 'dc-api-client'
// Registering `ExampleAPI` in `API.instances`, this method also returns created instance
API.registerInstance('ExampleAPI', { base: 'api.example.com', secure: false });
```

other.js

```js
import API from 'dc-api-client'
const { ExampleAPI } = API.instances;

// http://api.example.com/Controller/action
const res = await ExampleAPI.Controller.action();

// Works with WebSocket connection
// ws://api.example.com/socket
ExampleAPI.Socket.on('test', () => console.log('Test received'));
ExampleAPI.Socket.emit('send-me-test');
```

### POST utility

Sends POST request in browser with form.

```js
API.post(url: String, data: Object, newtab: Boolean = false);
```

### Alternative request sending

```ts
API.send(controller: String, action: String, data: any, query: Object): Promise<Response>;
```

## Known issues

### `dc-api-client` doesn't work properly with Rollup

Inject `NODE_ENV` variable with `process` object manually or use `rollup-plugin-inject-process-env`.

## Vanilla fallback

You can use [pre-bundled version (`browser.js` ~4 kb)](./browser.js) in browser without webpack,
parcel, browserify or other bundlers.

Compatibility:

| Internet Explorer | Edge | Firefox | Chrome | Safari | Opera |
|:-----------------:|:----:|:-------:|:------:|:------:|:-----:|
| **Not supported** | 12+  |   22+   |  49+   |  10+   |  36+  |
