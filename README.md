# Client for [dc-api-core](https://github.com/DimaCrafter/dc-api-core)

[![NPM](https://nodei.co/npm/dc-api-client.png)](https://npmjs.com/package/dc-api-client)

## Usage

```js
const API = require('dc-api-client');
const res = await API.Controller.action({ data });
```

Response:

```js
res = {
    success: Boolean,
    code: Number,     // HTTP response code
    msg: Any          // Response message
}
```

## TODOs

* [ ] No `EnventEmitter` dependency
* [ ] Transpiled version for pure JS
