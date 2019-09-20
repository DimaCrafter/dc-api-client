# Client for [dc-api-core](https://github.com/DimaCrafter/dc-api-core)

[![NPM](https://nodei.co/npm/dc-api-client.png)](https://npmjs.com/package/dc-api-client)

## Require dc-api-client to your project

```js
const API = require('dc-api-client');
```

## Make request to back-end

```js
const res = API.Controller.action({
    your_data_to_backend
});
```
> `Controller` - your controller name
> 
> `action` - your action name in controller

## Example

```js
const API = require('dc-api-client');
const res = API.Auth.register({
    login: 'test@mail.ru',
    password: '123123'
});
```

## Response

Name          | Type
------------- | -------------
success       | Boolean
code          | Int, HTTP code
msg           | String

## Response example

```js
res = {
    success: true,
    code: 200,
    msg: 'user_registred'
}
```

## TODOs

* [ ] No `EnventEmitter` dependency
* [ ] Transpiled version for pure JS
