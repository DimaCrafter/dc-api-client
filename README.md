# Client for [dc-api-core](https://github.com/DimaCrafter/dc-api-core)

[![NPM](https://nodei.co/npm/dc-api-client.png)](https://npmjs.com/package/dc-api-client)

## Import dc-api-client to your project

```js
const API = require('dc-api-client');
// OR use import for ES6+/TS
import API from 'dc-api-client'
```

## Make request to back-end

```js
const res = await API.Controller.action({
    // Any supported data types.
    // It can be any JSON-compitable type, such as strings, objects etc.
    // Also you can use any Blob/File value.
});
```

* `Controller` - your controller name
* `action` - your action name in controller
* `res` - [Response object](#Example)

## Response

| Name    | Type                                            |
|---------|-------------------------------------------------|
| success | `Boolean`                                       |
| code    | `Number`, HTTP code                             |
| msg     | Any JSON-compitable type returned from back-end |

## Example

Sending user data to `register` method in `Auth` controller.

```js
const API = require('dc-api-client');
const res = await API.Auth.register({
    login: 'test@mail.ru',
    password: '123123'
});
console.log(res);
```

Console output:

```js
{
    success: true,
    code: 200,
    msg: 'user_registred'
}
```
