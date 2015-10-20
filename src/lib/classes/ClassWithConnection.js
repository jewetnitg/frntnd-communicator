import events from 'events';

import _ from 'lodash';

import communicator from '../singletons/communicator';
import connections from '../singletons/connections';

import _Connection from './Connection';
import _Request from './Request';
import _Adapter from './Adapter';

/**
 * The {@link ClassWithConnection} class is there for you to extend.
 * It allows you to create classes that know how to connect to a server using a {@link Connection}.
 *
 * @property Adapter {Adapter} The {@link Adapter} class, exposed so {@link Adapter}s can be constructed, available on the instance as well as the class
 * @property Request {Request} The {@link Request} class, exposed so {@link Request}s can be constructed, available on the instance as well as the class
 * @property Connection {Connection} The {@link Connection} class, exposed so {@link Connection}s can be constructed, available on the instance as well as the class
 *
 * @property options {Object} Object passed into the constructor
 * @property connected {Boolean} Indicates whether the {@link Connection} has connected successfully
 *
 * @property connection {Connection} The {@link Connection} for this class, only available once connected.
 *
 * @class ClassWithConnection
 *
 * @global
 * @see {@link Connection}
 * @see {@link Request}
 * @example
 * class SomeClass extends ClassWithConnection {
 *
 *  constructor(options = {}) {
 *    options.connection = 'some-registered-connection';
 *
 *    options.adapters = {
 *      ...
 *    };
 *
 *    options.connections = {
 *      ...
 *    };
 *
 *    options.requests = {
 *      ...
 *    };
 *
 *    super(options);
 *
 *    this.on('connect', () => {
 *      // do some stuff
 *    });
 *  }
 *
 *  initialize() {
 *    // if implemented, the initialize method will be called on connect
 *  }
 *
 * }
 *
 * someInstance.on('connect', () => {
 *   someInstance.connection.get('/someRoute');
 * });
 *
 */
class ClassWithConnection {

  constructor(options = {}) {
    ClassWithConnection.validateImplementation(options);

    this.options = options;

    // initialize an empty object instantiated Requests belonging to this class will be stored on
    this.options.exposeRequestsOn = this.options.exposeRequestsOn || 'requests';
    this[this.options.exposeRequestsOn] = {};

    this._emitter = new events.EventEmitter();

    this._registerComponentsInOptions(options);

    this._callInitializeOnConnect();
    this.connect();
  }

  get Adapter() {
    return _Adapter;
  }

  get Request() {
    return _Request;
  }

  get Connection() {
    return _Connection;
  }

  static get Adapter() {
    return _Adapter;
  }

  static get Request() {
    return _Request;
  }

  static get Connection() {
    return _Connection;
  }

  /**************
   * PUBLIC API *
   **************/

  get connected() {
    return this.connection && this.connection.connected;
  }

  /**
   * Validates whether an object contains all properties to be considered a valid {@link ClassWithConnection} implementation.
   * A valid configuration consists of a connection property that is a string, and maps onto a {@link Connection}'s name that has been registered
   * @memberof ClassWithConnection
   * @method validateImplementation
   * @static
   * @param options {Object} Object containing the implementation for a {@link ClassWithConnection}
   * @throws Error
   */
  static validateImplementation(options = {}) {
    const baseMessage = `Can't construct ClassWithConnection`;

    if (typeof options.connection !== 'string') {
      throw new Error(`${baseMessage}, no connection specified`);
    }

    const connection = connections[options.connection];

    if (!connection) {
      throw new Error(`${baseMessage}, connection '${options.connection}' doesn't exist.`);
    }
  }

  /**
   * Listens for an event
   * @method on
   * @memberof ClassWithConnection
   * @instance
   * @param event {String} The event to listen to
   * @param cb {Function} Function that should be called when this event is triggered
   * @example
   * instance.on('event', (data) => {
   *   // handle event
   * });
   */
  on(event, cb) {
    return this._emitter.on(event, cb);
  }

  /**
   * Triggers an event
   * @method trigger
   * @memberof ClassWithConnection
   * @instance
   * @param event {String} The event to trigger
   * @param data {*} Data to pass to the event handlers
   * @example
   * instance.trigger('event', data);
   */
  trigger(event, data) {
    return this._emitter.emit(event, data);
  }

  /**
   * Connects this class to a server using a {@link Connection},
   * when connected the connection becomes available under this.connection and the 'connect' event is triggered (with the {@link Connection} as data).
   *
   * @method connect
   * @memberof ClassWithConnection
   * @instance
   * @param name {String} Name of the connection to connect to, defaults to this.options.connection
   * @example
   * instance.connect('local-xhr')
   *   .then(...);
   */
  connect(name = this.options.connection) {
    if (!this.connected) {
      return communicator.connect(name)
        .then((connection) => {
          this.connection = connection;
          this.trigger('connect', connection);
          return connection;
        });
    } else {
      return Promise.resolve(this.connection);
    }
  }

  /**
   * Registers a request for this class, the {@link Request} will become available under this.requests[request.shortName].
   *
   * @method registerRequest
   * @instance
   * @memberof ClassWithConnection
   *
   * @param requests {Object<Object>} Hashmap containing objects containing the properties for the {@link Request}
   *
   * @returns {Object<Request>}
   * @see {@link Request}
   * @example
   * instance.registerRequests({
   *   UserLoginRequest: {
   *     shortName: 'login',
   *     method: 'get',
   *     ...
   *   }
   * });
   */
  registerRequests(requests) {
    const _requests = {};

    _.each(requests, (request, name) => {
      request.name = request.name || name;
      request.connection = request.connection || this.options.connection;

      _requests[request.shortName] = this.registerRequest(request);
    });

    return _requests;
  }

  /**
   * Registers a {@link Request} for this class, the {@link Request} will become available under this.requests[request.shortName].
   *
   * @method registerRequest
   * @instance
   * @memberof ClassWithConnection
   *
   * @param request {Object} Object containing the properties for the {@link Request}
   *
   * @returns {Request}
   * @see {@link Request}
   * @example
   * instance.registerRequest({...});
   */
  registerRequest(request) {
    const isRequestInstance = request && request.constructor && request.constructor._type === 'Request';
    const _request = isRequestInstance ? request : communicator.registerRequest(request);

    _request.execute._request = _request;

    return this[this.options.exposeRequestsOn][_request.options.shortName] = _request.execute;

  }

  /**
   * Registers an {@link Adapter}
   *
   * @method registerAdapter
   * @static
   * @memberof ClassWithConnection
   *
   * @param adapter {Object} Object containing the properties (implementation) for the {@link Adapter}
   *
   * @returns {Adapter}
   * @see {@link Adapter}
   * @example
   * ClassWithConnection.registerAdapter({
   *   name: 'XHR',
   *   ...
   * });
   */
  static registerAdapter(adapter) {
    return communicator.registerAdapter(adapter);
  }

  /**
   * Registers {@link Adapter}s
   *
   * @method registerAdapters
   * @static
   * @memberof ClassWithConnection
   *
   * @param adapters {Object<Object>} Hashmap containing objects containing the properties for the {@link Adapter}s
   *
   * @returns {Object<Adapter>}
   * @see {@link Adapter}
   * @example
   * ClassWithConnection.registerAdapter({
   *   'XHR': {
   *     ...
   *   }
   * });
   */
  static registerAdapters(adapters) {
    return communicator.registerAdapters(adapters);
  }

  /**
   * Registers a {@link Connection}
   *
   * @method registerConnection
   * @static
   * @memberof ClassWithConnection
   *
   * @param connection {Object} Object containing the properties for the {@link Connection}
   *
   * @returns {Connection}
   * @see {@link Connection}
   * @example
   * ClassWithConnection.registerConnection({
   *   name: 'local-xhr',
   *   adapter: 'XHR',
   *   url: 'http://localhost:1337'
   * });
   */
  static registerConnection(connection) {
    return communicator.registerConnection(connection);
  }

  /**
   * Registers {@link Connection}s
   *
   * @method registerConnections
   * @static
   * @memberof ClassWithConnection
   *
   * @param connections {Object<Object>} Hashmap containing objects containing the properties for the {@link Connection}s
   *
   * @returns {Object<Connection>}
   * @see {@link Connection}
   * @example
   * ClassWithConnection.registerConnection({
   *   'local-xhr': {
   *     adapter: 'XHR',
   *     url: 'http://localhost:1337'
   *   }
   * });
   */
  static registerConnections(connections) {
    return communicator.registerConnections(connections);
  }

  /***************
   * PRIVATE API *
   ***************/

  _registerComponentsInOptions(options = {}) {
    if (options.adapters) {
      ClassWithConnection.registerAdapters(options.adapters);
    }

    if (options.connections) {
      ClassWithConnection.registerConnections(options.connections);
    }

    if (options.requests) {
      this.registerRequests(options.requests);
    }
  }

  _callInitializeOnConnect() {
    if (typeof this.initialize === 'function') {
      this.on('connect', () => {
        this.initialize();
      });
    }
  }

}

export default ClassWithConnection;