import events from 'events'

import _ from 'lodash';

import routeUtil from 'frntnd-route-util';

import adapters from '../singletons/adapters';
import connections from '../singletons/connections';

import CONNECTION_STATE from '../enums/CONNECTION_STATE';

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
 * // full implementation,
 * // as an end user you should pass this object into the registerConnection method on the communicator singleton
 * // instead instantiating a Connection manually like below
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
    this.constructor.validateImplementation(options);

    this.options = options;

    this._state = CONNECTION_STATE.DISCONNECTED;

    this.adapter = adapters[this.options.adapter];

    this._emitter = new events.EventEmitter();
  }

  /***************
   * PUBLIC API *
   ***************/

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
    const baseMessage = `Can't construct Connection`;

    const makeMessage = (attributeName, attributeType) => {
      if (attributeType) {
        return `${baseMessage}, ${attributeName} should be specified as a ${attributeType} in the options.`;
      } else {
        return `${baseMessage}, ${attributeName}`;
      }
    };

    if (typeof options.name !== 'string') {
      throw new Error(makeMessage('name', 'string'));
    }

    if (connections[options.name]) {
      throw new Error(makeMessage(`name '${options.name}' is not unique.`));
    }

    if (typeof options.adapter !== 'string') {
      throw new Error(makeMessage('adapter', 'string'));
    }

    if (typeof options.url !== 'string') {
      throw new Error(makeMessage('url', 'string'));
    }

    const adapter = adapters[options.adapter];

    if (!adapter) {
      throw new Error(makeMessage(`adapter '${options.adapter}' not found.`));
    }
  }

  /**
   * Registers a {@link Connection}
   * @method register
   * @static
   * @memberof Connection
   * @param options {Object} Object containing the properties for a {@link Connection}
   * @returns {Connection}
   */
  static register(options) {
    this.validateImplementation(options);

    connections[options.name] = new Connection(options);

    return connections[options.name];

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
  request(request, data) {
    const _request = this._prepareRequest(request, data);

    const handleResolve = (data) => {
      if (typeof request.resolve === 'function') {
        return request.resolve(data);
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

  /**
   *
   * @param request
   * @param data
   * @returns {{}}
   * @private
   */
  _prepareRequest(request, data) {
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