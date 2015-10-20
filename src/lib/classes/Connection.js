import events from 'events'

import _ from 'lodash';

import routeUtil from 'frntnd-route-util';

import adapters from '../singletons/adapters';
import connections from '../singletons/connections';

import Adapter from './Adapter';
import Request from './Request';

import CONNECTION_STATE from '../enums/CONNECTION_STATE';
import REQUEST_METHODS from '../enums/REQUEST_METHODS';

import ConnectionInvalidPropertyException from '../exceptions/ConnectionInvalidPropertyException';
import ConnectionMissingPropertyException from '../exceptions/ConnectionMissingPropertyException';

import RequestInvalidPropertyException from '../exceptions/RequestInvalidPropertyException';
import RequestMissingPropertyException from '../exceptions/RequestMissingPropertyException';

/**
 * The {@link Connection} class serves to execute {@link Request}s using an {@link Adapter}.
 *
 * @property name {String} Name of the connection, 'local-xhr' for example
 * @property adapter {String} Reference to the name of an {@link Adapter}, 'XHR' for example, the {@link Connection} will use this adapter to execute {@link Request}s
 * @property url {String} The base url of the connection, including protocol and port (if necessary), 'http://localhost:1337' for example
 *
 * @property options {Object} **SET AUTOMATICALLY** Options passed into the constructor
 * @property state {enums/CONNECTION_STATE} **SET AUTOMATICALLY** The connection state of the {@link Connection}
 * @property connected {Boolean} **SET AUTOMATICALLY** Boolean indicating whether this {@link Connection} is connected
 * @property disconnected {Boolean} **SET AUTOMATICALLY** Boolean indicating whether this {@link Connection} is disconnected
 * @property connecting {Boolean} **SET AUTOMATICALLY** Boolean indicating whether this {@link Connection} is connecting
 *
 * @param options {Object} Object containing the properties (name, adapter and url)
 *
 * @class Connection
 * @see {@link Adapter}
 * @see {@link Communicator}
 *
 * @global
 * @example
 * const connection = new Connection({
 *   name: 'local-xhr',
 *   url: 'http://localhost:1337',
 *   adapter: 'XHR'
 * });
 *
 * // execute Requests
 * connection.request(request, data)
 *   .then(...);
 *
 * // execute undefined request
 * connection.get('/some/route/:id', data)
 *   .then(...);
 * connection.post('/some/route/:id', data)
 *   .then(...);
 * connection.put('/some/route/:id', data)
 *   .then(...);
 * connection.delete('/some/route/:id', data)
 *   .then(...);
 *
 * // subscribe to server events
 * connection.subscribe('user', (ev) => {
 *   // event received from server
 *   console.log(ev);
 * });
 *
 * // unsubscribe from server events
 * connection.unsubscribe('user');
 *
 * // listen for events on the connection
 * connection.on('connect', () => {
 *
 * });
 *
 * connection.on('connectFail', () => {
 *
 * });
 *
 * // listen for custom events
 * connection.on('someEvent', (data) => {
 *
 * });
 *
 * // trigger custom events
 * connection.trigger('someEvent', data);
 *
 *
 */
class Connection {

  constructor(options = {}) {
    this._registerComponentsInOptions(options);

    const connection = Connection.get(options.name);

    if (connection) {
      return connection;
    }

    // initialize an empty object instantiated Requests belonging to this Connection will be stored on
    options.exposeRequestsOn = options.exposeRequestsOn || 'requests';
    this[options.exposeRequestsOn] = {};

    this.options = options;

    this._register(options);

    this.adapter = adapters[this.options.adapter];
    this._state = CONNECTION_STATE.DISCONNECTED;
    this._emitter = new events.EventEmitter();
  }

  /***************
   * PUBLIC API *
   ***************/

  /**
   * Registers {@link Adapter}s, provided as a hashmap Object<Object>
   * @static
   * @method registerAdapters
   * @memberof Connection
   * @param adapters {Object<Object>} Hashmap containing properties for {@link Adapter}s
   * @returns {Object<Adapter>}
   * @example
   * Connection.registerAdapters({
   *   someAdapter: {
   *     ...
   *   }
   * });
   */
  static registerAdapters(adapters) {
    const _adapters = {};

    _.each(adapters, (adapter, name) => {
      if (!adapter.name) {
        adapter.name = name;
      }

      _adapters[adapter.name] = this.registerAdapter(adapter);
    });

    return _adapters;
  }

  /**
   * Registers a single {@link Adapter}
   * @static
   * @method registerAdapter
   * @memberof Connection
   * @param adapter {Object} object containing properties for {@link Adapter}
   * @returns {Adapter}
   * @example
   * Connection.registerAdapter({
   *   name: 'someAdapter',
   *   ...
   * });
   */
  static registerAdapter(adapter = {}) {
    return new Adapter(adapter);
  }

  /**
   * Registers a request for this connection, the {@link Request} will become available under this.requests[request.shortName].
   *
   * @method registerRequest
   * @instance
   * @memberof Connection
   *
   * @param requests {Object<Object>} Hashmap containing objects containing the properties for the {@link Request}
   *
   * @returns {Object<Request>}
   * @see {@link Request}
   * @example
   * connection.registerRequests({
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
      request.connection = this.options.name;

      _requests[request.shortName] = this.registerRequest(request);
    });

    return _requests;
  }

  /**
   * Registers a {@link Request} for this {@link Connection}, the {@link Request} will become available under this.requests[request.shortName].
   *
   * @method registerRequest
   * @instance
   * @memberof Connection
   *
   * @param request {Object} Object containing the properties for the {@link Request}
   *
   * @returns {Request}
   * @see {@link Request}
   * @example
   * connection.registerRequest({...});
   */
  registerRequest(request) {
    const isRequestInstance = request && request.constructor && request.constructor._type === 'Request';
    const _request = isRequestInstance ? request : new Request(request);

    _request.execute._request = _request;

    return this[this.options.exposeRequestsOn][_request.options.shortName] = _request.execute;
  }

  /**
   * Gets a {@link Connection} instance by name
   * @static
   * @method get
   * @memberof Connection
   * @param name
   * @returns {Connection|undefined}
   */
  static get(name) {
    return connections[name];
  }

  /**
   * Validates an implementation of a {@link Connection} (a POJO containing the properties), throws an Error when a validation error occurs.
   * @static
   * @method validateImplementation
   * @param options {Object} The implementation to validate
   * @memberof Connection
   * @throws Error
   * @param options
   */
  static validateImplementation(options) {
    // name

    if (typeof options.name === 'undefined' || options.name === null) {
      throw new ConnectionMissingPropertyException('no name provided');
    }

    if (typeof options.name !== 'string') {
      throw new ConnectionInvalidPropertyException('name is not a string');
    }

    // adapter

    if (typeof options.adapter === 'undefined' || options.adapter === null) {
      throw new ConnectionMissingPropertyException('no adapter provided');
    }

    if (typeof options.adapter !== 'string') {
      throw new ConnectionInvalidPropertyException('adapter is not a string');
    }

    if (!adapters[options.adapter]) {
      throw new ConnectionInvalidPropertyException(`adapter ${options.adapter} isn't a registered adapter`);
    }

    // url

    if (typeof options.url === 'undefined' || options.url === null) {
      throw new ConnectionMissingPropertyException('no url provided');
    }

    if (typeof options.url !== 'string') {
      throw new ConnectionInvalidPropertyException('url is not a string');
    }
  }

  get state() {
    return this._state;
  }

  get connected() {
    return this.state === CONNECTION_STATE.CONNECTED;
  }

  get connecting() {
    return this.state === CONNECTION_STATE.CONNECTING;
  }

  get disconnected() {
    return this.state === CONNECTION_STATE.DISCONNECTED;
  }

  /**
   * Ensures a the {@link Connection} is connected.
   * @method connect
   * @memberof Connection
   * @instance
   * @returns {Promise}
   * @example
   * connection.connect()
   *   .then(...);
   */
  connect() {
    let promise = null;

    if (this.connected) {
      promise = Promise.resolve();

    } else if (this.connecting) {
      promise = new Promise((resolve, reject) => {
        this.on('connect', resolve);
        this.on('connectionFail', reject);
      });

    } else {
      promise = this._establishNewConnection();
    }

    return promise;
  }

  _establishNewConnection() {
    this._state = CONNECTION_STATE.CONNECTING;

    return this.adapter.connect(this.options.url)
      .then(() => {
        this._state = CONNECTION_STATE.CONNECTED;
        this.trigger('connect');

        return Promise.resolve();
      },
      () => {
        this._state = CONNECTION_STATE.DISCONNECTED;
        this.trigger('connectionFail');

        return Promise.reject();
      });
  }


  /**
   * Disconnects this {@link Connection}
   * @method disconnect
   * @memberof Connection
   * @instance
   * @returns {Promise}
   * @example
   * connection.disconnect()
   *  .then(...);
   */
  disconnect() {
    return this.adapter.disconnect()
      .then(() => {
        this._state = CONNECTION_STATE.DISCONNECTED;
        return Promise.resolve();
      });
  }

  /**
   * Executes a post request using this {@link Connection}
   * @method post
   * @instance
   * @memberof Connection
   * @param route {String} Route of the request, splats will be filled with data from the data parameter
   * @param data {*} Data to send with the request and fill splats in the route with
   * @returns {Promise}
   * @example
   * connection.post('/user/:splat', {splat: 3})
   *   .then(...);
   */
  post(route, data = {}) {
    return this.request({
      method: 'POST',
      route
    }, data);
  }

  /**
   * Executes a put request using this {@link Connection}
   * @method put
   * @instance
   * @memberof Connection
   * @param route {String} Route of the request, splats will be filled with data from the data parameter
   * @param data {*} Data to send with the request and fill splats in the route with
   * @returns {Promise}
   * @example
   * connection.put('/user/:splat', {splat: 3})
   *   .then(...);
   */
  put(route, data) {
    return this.request({
      method: 'PUT',
      route
    }, data);
  }

  /**
   * Executes a delete request using this {@link Connection}
   * @method delete
   * @instance
   * @memberof Connection
   * @param route {String} Route of the request, splats will be filled with data from the data parameter
   * @param data {*} Data to send with the request and fill splats in the route with
   * @returns {Promise}
   * @example
   * connection.delete('/user/:splat', {splat: 3})
   *   .then(...);
   */
  'delete'(route, data) {
    return this.request({
      method: 'DELETE',
      route
    }, data);
  }

  /**
   * Executes a get request using this {@link Connection}
   * @method get
   * @instance
   * @memberof Connection
   * @param route {String} Route of the request, splats will be filled with data from the data parameter
   * @param data {*} Data to send with the request and fill splats in the route with
   * @returns {Promise}
   * @example
   * connection.get('/user/:splat', {splat: 3})
   *   .then(...);
   */
  get(route, data) {
    return this.request({
      method: 'GET',
      route
    }, data);
  }

  /**
   * Triggers an event with data
   * @param event {String} Event to trigger
   * @param data {*} Data to pass into the event handler(s)
   * @instance
   * @method trigger
   * @memberof Connection
   * @example
   * connection.trigger('someEvent', data);
   */
  trigger(event, data) {
    return this._emitter.emit(event, data);
  }

  /**
   * Listens for an event
   * @param event {String} Event to listen to
   * @param cb {Function} Function to call when event has occurred
   * @instance
   * @method on
   * @memberof Connection
   * @example
   * connection.on('someEvent', data => {
   *   // ...
   * });
   */
  on(event, cb) {
    return this._emitter.on(event, cb);
  }

  /**
   * Subscribe to a server event
   * @param event {String} Event to subscribe to
   * @param cb {Function} Function to execute when the event has been received from the server
   * @method subscribe
   * @instance
   * @memberof Connection
   * @returns {Promise}
   * @example
   * connection.subscribe('event', data => {
   *     // ...
   *   })
   *   .then(...);
   */
  subscribe(event, cb) {
    return this.adapter.subscribe(event, cb);
  }

  /**
   * Remove all subscriptions from an event
   *
   * @param event {String} Event to unsubscribe from
   *
   * @method unsubscribe
   * @instance
   * @memberof Connection
   * @returns {Promise}
   * @example
   * connection.unsubscribe('event')
   *   .then(...);
   */
  unsubscribe(event) {
    return this.adapter.unsubscribe(event);
  }

  /**
   * Executes a {@link Request} with data
   * @instance
   * @memberof Connection
   * @method request
   * @param request {Request} The {@link Request} to execute
   * @param data {*} Data to send with this {@link Request}
   * @returns {Promise}
   * @see {@link Request}
   * @example
   * connection.request(request, data)
   *   .then(...)
   */
  request(request = {}, data = {}) {
    Request.validateImplementation(request, true);

    const _request = this._prepareRequest(request, data);

    const handleResolve = (data) => {
      if (typeof request.resolve === 'function') {
        return request.resolve(data);
      } else {
        return data;
      }
    };

    const handleReject = (data) => {
      if (typeof request.reject === 'function') {
        return request.reject(data);
      }
    };

    if (request.upload) {
      return this.adapter.upload(_request)
        .then(handleResolve, handleReject);
    } else {
      return this.adapter.request(_request)
        .then(handleResolve, handleReject);
    }
  }

  /***************
   * PRIVATE API *
   ***************/

  static get _type() {
    return 'Connection';
  }

  _register(options = {}) {
    Connection.validateImplementation(options);

    if (!connections[options.name]) {
      connections[options.name] = this;
    }

    return connections[options.name];
  }

  _registerComponentsInOptions(options = {}) {
    if (options.adapters) {
      Connection.registerAdapters(options.adapters, 'Adapter');
    }

    if (options.requests) {
      this.registerRequests(options.requests);
    }
  }

  /**
   *
   * @param request
   * @param data
   * @returns {{}}
   * @private
   */
  _prepareRequest(request = {}, data = {}) {
    const _request = {};
    const filledUrl = routeUtil.fillRouteWithPathVariables(request.route, data);

    _request.url = routeUtil.concatenateBaseUrlAndUrl(this.options.url, filledUrl);
    _request.method = request.method;
    _request.data = data;

    _request.request = request;

    return _request;
  }

}

export default Connection;