import _ from 'lodash';

import ClassWithPlugins from 'frntnd-class-with-plugins';

import Adapter from './Adapter';
import Connection from './Connection';
import Request from './Request';

import _adapters from '../singletons/adapters';
import _connections from '../singletons/connections';
import _requests from '../singletons/requests';
import REQUEST_METHODS from '../enums/REQUEST_METHODS';

class Communicator extends ClassWithPlugins {

  static get _type() {
    return 'Communicator';
  }

  constructor(options = {}) {
    options.config = {};
    super(options)
  }

  get connections() {
    return _connections;
  }

  get requests() {
    return _requests;
  }

  get adapters() {
    return _adapters;
  }

  registerAdapters(adapters) {
    if (Array.isArray(adapters)) {
      _.each(adapters, this.registerAdapter, this)
    } else if (typeof adapters === 'object') {
      _.each(adapters, (adapter, name) => {
        const _adapter = {
          adapter,
          name
        };

        this.registerAdapter(_adapter);
      });
    }
  }

  registerAdapter(options) {
    if (this.adapters[options.name]) {
      throw new Error(`Can't register '${options.name}' adapter, adapter with this name already exists.`);
    }

    this.adapters[options.name] = new Adapter(options);

    return this.adapters[options.name];
  }

  registerConnections(connections) {
    if (Array.isArray(connections)) {
      return _.map(connections, this.registerConnection, this)
    } else if (typeof connections === 'object') {
      return _.map(connections, (connection, name) => {
        connection.name = name;
        return this.registerConnection(connection);
      });
    }
  }

  registerConnection(options = {}) {
    if (options.baseUrl) {
      options.url = options.baseUrl;
      delete options.baseUrl;
    }

    if (!options.name || !options.url || !options.adapter) {
      throw new Error(`Can't register Connection. name, url and adapter must be specified.`);
    }

    if (this.connections[options.name]) {
      throw new Error(`Can't register Connection. Connection with name '${options.name}' already exists.`);
    }

    this.connections[options.name] = new Connection(options);

    return this.connections[options.name];
  }

  registerRequests(requests) {
    if (Array.isArray(requests)) {
      return _.map(requests, this.registerRequest, this)
    } else if (typeof requests === 'object') {
      return _.map(requests, (request, name) => {
        request.name = name;
        return this.registerRequest(request);
      });
    }
  }

  registerRequest(options = {}) {
    if (this.requests[options.name]) {
      throw new Error(`Can't register '${options.name}' request, request with name '${options.name}' already exists.`);
    }

    if (!this.connections[options.connection]) {
      throw new Error(`Can't register '${options.name}' request, connection with name '${options.connection}' not found.`);
    }

    if (!(typeof options.method === 'string' && REQUEST_METHODS[options.method.toUpperCase()])) {
      throw new Error(`Can't register '${options.name}' request, invalid method provided.`);
    }

    this.requests[options.name] = new Request(options);

    return this.requests[options.name];
  }

  setConfig(attr, val) {
    if (typeof attr === 'object') {
      _.extend(this.config, val);
    } else if (typeof val !== 'undefined' && typeof attr === 'string') {
      this.config[attr] = val;
    }
  }

  connect(name) {
    if (this.connections[name]) {
      return this.connections[name].connect()
        .then(() => {
          return this.connections[name];
        });
    } else {
      throw new Error(`Can't connect to connection '${name}', connection not found.`);
    }
  }

  disconnect(name) {
    const connection = this.connections[name];

    if (!connection) {
      throw new Error(`Can't disconnect, connection with name '${name}' not found`);
    }

    delete this.connections[name];

    return connection.disconnect();
  }

}

export default Communicator;