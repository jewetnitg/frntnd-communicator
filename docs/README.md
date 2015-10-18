Communicator readme
=============

Communicator is an api for communicating with a server, it executes {@link Request}s using {@link Connection}s which, in turn, use {@link Adapter}s to do the actual transport of data.

Installing
=====

In the root of the project run:
```
npm install
```

Testing
=====
In the root of the project run:
```
npm test
```

Building
======
In the root of the project run:
```
npm run build
```


Usage
=====
#### Implement an {@link Adapter}, there is a default XHR {@link Adapter} provided in ./src/impl/adapters/XHR.js

```
import communicator from 'communicator';

communicator.registerAdapter({
  name: 'XHR',
  connect() {...},
  disconnect() {...},
  request() {...}
  ...
});
```

#### Implement a {@link Connection}
```
import communicator from 'communicator';

communicator.registerConnection({
  name: 'local-xhr',
  adapter: 'XHR',
  url: 'http://localhost:1337'
});
```

#### Implement a {@link Request}
```
import communicator from 'communicator';

communicator.registerRequest({
  name: 'TestRequest',
  shortName: 'test',
  connection: 'local-xhr',
  route: '/route/:splat',
  method: 'get',
  resolve() {..}, // optional
  reject() {..} // optional
});
```

#### Implementing {@link ClassWithConnection}
```

class SomeClass extends ClassWithConnection {

  constructor(options = {}) {
    options.connection = 'local-xhr';
    options.requests = {}; // requests passed into the constructor like this will be registered automatically
    super(options);

    this.on('connect', () => {
      // do some stuff
    });
  }

  initialize() {
    // if implemented, the initialize method will be called on connect
  }

}

// before instantiating make sure you have registered the Connections (and it's Adapters) this class uses
// register the Adapter first because Connections depend on Adapters
SomeInstance.registerAdapter({
  name: 'XHR',
  ...
});

// register the connection
SomeInstance.registerConnection({
  name: 'local-xhr',
  adapter: 'XHR',
  url: 'http://localhost:1337'
});

// instantiate the class
const someInstance = new SomeClass();

// handle the connect event
someInstance.on('connect', () => {
  someInstance.connection.get('/someRoute');
});

// register a request for this class
someInstance.registerRequest({
  name: 'UserLoginRequest',
  shortName: 'login',
  method: 'get',
  url: '/user/login',
  connection: 'local-xhr'
});

// after registering the request will be available under the requests object,
// in particular the Requests execute method
someInstance.requests.login(data)
  .then(...);

// you can access the instance of the Request on the _request key
someInstance.requests.login._request;
```