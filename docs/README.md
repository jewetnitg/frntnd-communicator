Communicator readme
=============

Communicator is an api for communicating with a server, it executes {@link Request}s using {@link Connection}s which, in turn, use {@link Adapter}s to do the actual transport of data.

Installing
=====

```
npm install frntnd-communicator --save
```

for information on how to build the library itself and run tests see, {@tutorial installing, building and testing}

Usage
=====
#### Implement an {@link Adapter}, there is a default XHR {@link Adapter} provided in ./src/impl/adapters/XHR.js

```
import communicator from 'communicator';

const adapter = communicator.registerAdapter({
  name: 'XHR',
  connect() {...},
  disconnect() {...},
  request() {...}
  ...
});

// or

const adapter = new communicator.Adapter({
  ...
});
```

#### Implement a {@link Connection}
```
import communicator from 'communicator';

const connection = communicator.registerConnection({
  name: 'local-xhr',
  adapter: 'XHR',
  url: 'http://localhost:1337'
});

// or

const connection = new communicator.Connection({
  ...
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

// or

const request = new communicator.Request({
  ...
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

// before instantiating make sure you have registered the Connection (and it's Adapter) this class uses
// you must register the Adapter first because Connections depend on Adapters


SomeInstance.registerAdapter({
  name: 'XHR',
  ...
});

// or

const adapter = new SomeInstance.Adapter({
  ...
});


// registering a connection

SomeInstance.registerConnection({
  name: 'local-xhr',
  adapter: 'XHR',
  url: 'http://localhost:1337'
});

// or

const connection = new SomeInstance.Connection({
  ...
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