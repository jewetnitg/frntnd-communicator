Communicator readme
=============

Communicator is an api for communicating with a server, it executes {@link Request}s using {@link Connection}s which, in turn, use {@link Adapter}s to do the actually transport of data.

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
#### Implement an {@link Adapter}, there is a default XHR {@link Adapter} provided in ./src/lib/adapters/XHR.js

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
  url: 'http://localhost:1337',
  serverDefinition: '/_describe' // optional
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