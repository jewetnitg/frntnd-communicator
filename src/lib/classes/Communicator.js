import _ from 'lodash';

import Adapter from './Adapter';
import Connection from './Connection';
import Request from './Request';

import _adapters from '../singletons/adapters';
import _connections from '../singletons/connections';
import _requests from '../singletons/requests';
import _config from '../singletons/config';

/**
 * The {@link Communicator} class serves to abstract communications with a server,
 * it does so by executing {@link Request}s using a {@link Connection} that talks to the server using an {@link Adapter}.
 * Options passed into the constructor will be available under the options property
 *
 * @see {@link Adapter}
 * @see {@link Connection}
 * @see {@link Request}
 *
 * @property options {Object} Options object that was passed into the constructor
 *
 * @property config {Object} Configuration for the communicator, containing properties such as 'defaultConnection'
 *
 * @property adapters {Object} Hashmap containing adapters, this object will be registered using {@link Communicator#registerAdapters}
 * @property connections {Object} Hashmap containing connections, this object will be registered using {@link Communicator#registerConnections}
 * @property requests {Object} Hashmap containing requests, this object will be registered using {@link Communicator#registerRequests}
 *
 * @param options {Object} Object containing the properties
 *
 * @class Communicator
 * @global
 * @example
 * const communicator = new Communicator();
 *
 * // register an Adapter
 * communicator.registerAdapter({
 *   name: 'XHR',
 *   request(request) {
 *     // handle request and return a promise that resolves with the server response
 *     // reject the promise if the request was unsuccessful
 *   }
 * });
 *
 * // register a Connection
 * const connection = communicator.registerConnection({
 *   name: 'local-xhr',
 *   url: 'http://localhost:1337',
 *   adapter: 'XHR'
 * });
 *
 * // register a Request
 * const request = communicator.registerRequest({
 *   name: 'FindByIdUsersRequest',
 *   shortName: 'findById',
 *   route: '/user/:id',
 *   method: 'get',
 *   connection: 'local-xhr'
 * });
 *
 * // to execute the Request using its Connection
 * request.execute({
 *     id: 4
 *   })
 *   .then(...);
 *
 * // to execute a Request using a Connection
 * connection.request(request, {
 *     id: 4
 *   })
 *   .then(...);
 */
class Communicator {

  get config() {
    return _config;
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

  /**
   **************
   * PUBLIC API *
   **************
   */

  /**
   ***************
   * REGISTERING *
   ***************
   */

  /**
   * Registers {@link Adapter}s (provided as a hashmap) so they can be used by {@link Connection}s, also available as a static method.
   * @memberof Communicator
   * @method registerAdapters
   * @instance
   * @param adapters {Object<Object>} Hashmap containing objects containing the properties for {@link Adapter}s
   * @see {@link Adapter}
   * @example
   * communicator.registerAdapters({...});
   */
  registerAdapters(adapters) {
    return this.constructor.registerAdapters(adapters);
  }

  static registerAdapters(adapters) {
    this._registerComponents(adapters, 'Adapter');
  }

  /**
   * Registers {@link Connection}s (provided as a hashmap) so they can be used by {@link Request}s, also available as a static method.
   * @memberof Communicator
   * @method registerConnections
   * @instance
   * @param connections {Object<Object>} Hashmap containing objects containing the properties for {@link Connection}s
   * @see {@link Connection}
   * @example
   * communicator.registerConnections({...});
   */
  registerConnections(connections) {
    return this.constructor.registerConnections(connections);
  }

  static registerConnections(connections) {
    this._registerComponents(connections, 'Connection');
  }

  /**
   * Registers {@link Request}s (provided as a hashmap), also available as a static method.
   * @memberof Communicator
   * @method registerRequests
   * @instance
   * @param requests {Object<Object>} Hashmap containing objects containing the properties for {@link Request}s
   * @see {@link Request}
   * @example
   * communicator.registerRequests({...});
   */
  registerRequests(requests) {
    return this.constructor.registerRequests(requests);
  }

  static registerRequests(requests) {
    return this._registerComponents(requests, 'Request');
  }

  /**
   * Registers a {@link Adapter} so it can be used by {@link Connection}s, also available as a static method.
   * @memberof Communicator
   * @method registerAdapter
   * @instance
   * @param adapter {Object} Object containing the properties for an {@link Adapter}
   * @see {@link Adapter}
   * @example
   * communicator.registerAdapter({...});
   */
  registerAdapter(adapter) {
    return this.constructor.registerAdapter(adapter);
  }

  static registerAdapter(adapter) {
    if (!_config.defaultAdapter) {
      _config.defaultAdapter = adapter.name;
    }

    return Adapter.register(adapter);
  }

  /**
   * Register a {@link Connection} so it can be used by {@link Request}s, also available as a static method.
   * Registers a {@link Connection}
   * @memberof Communicator
   * @method registerConnection
   * @instance
   * @param connection {Object} Object containing the properties for a {@link Connection}
   * @see {@link Connection}
   * @example
   * communicator.registerConnection({...});
   */
  registerConnection(connection) {
    return this.constructor.registerConnection(connection);
  }

  static registerConnection(connection = {}) {
    if (!_config.defaultConnection) {
      _config.defaultConnection = connection.name;
    }

    return Connection.register(connection);
  }

  /**
   * Registers a {@link Request}
   * @memberof Communicator
   * @method registerRequest
   * @instance
   * @param request {Object} Object containing the properties for a {@link Request}
   * @see {@link Request}
   * @example
   * communicator.registerRequest({...});
   */
  registerRequest(request) {
    return this.constructor.registerRequest(request);
  }

  static registerRequest(request = {}) {
    return Request.register(request);
  }

  /**
   ********************************
   * CONNECTING AND DISCONNECTING *
   ********************************
   */

  /**
   * Connects a previously registered {@link Connection}.
   * @method connect
   * @memberof Communicator
   * @instance
   * @param name {String|Connection} Name of the {@link connection} (or a {@link Connection} instance) that should be connected.
   * @returns {Promise}
   * @example
   * communicator.connect('local-xhr')
   *   .then(...);
   */
  connect(name = _config.defaultConnection) {
    const nameIsString = typeof name === 'string';
    const connection = nameIsString ? this.connections[name] : name;

    if (connection) {
      return connection.connect()
        .then(() => {
          return connection;
        });
    } else {
      throw new Error(`Can't connect to connection '${name}', connection not found.`);
    }
  }

  /**
   * Disconnects a {@link Connection}
   * @method disconnect
   * @param name {String|Connection} Name of the {@link connection} (or a {@link Connection} instance) that should be disconnected.
   * @memberof Communicator
   * @instance
   * @returns {Promise}
   * @example
   * communicator.disconnect('local-xhr')
   *   .then(...);
   */
  disconnect(name = _config.defaultConnection) {
    const nameIsString = typeof name === 'string';
    const connection = nameIsString ? this.connections[name] : name;

    if (!connection) {
      if (nameIsString) {
        throw new Error(`Can't disconnect, Connection with name '${name}' not found`);
      } else {
        throw new Error(`Can't disconnect, no Connection provided.`);
      }
    }

    return connection.disconnect();
  }

  /**
   ***************
   * PRIVATE API *
   ***************
   */

  /**
   * registers a hashmap of components for a class
   * @method _registerComponents
   * @memberof Communicator
   * @private
   * @param components {Object<Object>} Hashmap of components, keys being the names of them
   * @param className {String} Name of the class for which these are components
   * @returns {Object<className>}
   */
  static _registerComponents(components, className) {
    const _components = {};

    _.each(components, (component, name) => {
      if (!component.name) {
        component.name = name;
      }

      _components[component.shortName] = this[`register${className}`](component);
    });

    return _components;
  }

}

export default Communicator;