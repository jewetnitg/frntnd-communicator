import events from 'events';

import _ from 'lodash';

import adapters from '../singletons/adapters';
import connections from '../singletons/connections';
import requests from '../singletons/requests';

import REQUEST_METHODS from '../enums/REQUEST_METHODS';

import Cacher from 'frntnd-cacher';

import RequestInvalidPropertyException from '../exceptions/RequestInvalidPropertyException';
import RequestMissingPropertyException from '../exceptions/RequestMissingPropertyException';
import RequestRuntimeException from '../exceptions/RequestRuntimeException';

const EventEmitter = events.EventEmitter;

/**
 * A {@link Request} is a blueprint for a request, after defining one, all you need is a the data to execute it.
 *
 * @property name {String} Full name of the request, 'UserLoginRequest' for example
 * @property shortName {String} The short name of this request, 'login' for example
 * @property method {String} The method of this request, 'get' for example
 * @property connection {String} The connection this {@link Request} should use to execute
 * @property route {String} The route of the this request, relative to the url of the connection, '/user/:id' for example
 * @property resolve {Function} When specified this method gets called when the request was successful
 * @property reject {Function} When specified this method gets called when the request was unsuccessful
 *
 * @param options {Object} Object containing the properties
 * @class Request
 * @see {@link Communicator}
 * @see {@link Connection}
 * @see {@link ClassWithConnection}
 * @global
 * @example
 * const request = new Request({
 *   name: 'UserLoginRequest',
 *   shortName: 'login',
 *   method: 'get',
 *   route: '/user/login',
 *   connection: 'local-xhr',
 *   resolve(data) {
 *     return new Promise((resolve, reject) => {
 *       // we can make a resolving request reject if we want to here
 *       reject(data);
 *     });
 *   },
 *   resolve(data) {
 *     return new Promise((resolve, reject) => {
 *       // we can make a reject request resolve if we want to here
 *       resolve(data);
 *     });
 *   }
 * });
 *
 * // executing a Request using it's Connection
 * request.execute({data: {asd: true}})
 *   .then(...);
 *
 * // executing a Request using an explicit Connection
 * request.execute({data: {asd: true}}, connection)
 *   .then(...);
 */
class Request {

  constructor(options = {}) {
    const request = Request.get(options.name || options);

    if (request) {
      return request;
    }

    this._register(options);

    this.options = options;

    this.method = this.options.method.toUpperCase();
    this.route = this.options.route;
    this.connection = this.options.connection;

    this.resolve = this.options.resolve || this.resolve;
    this.reject = this.options.reject || this.reject;

    if (this.options.connection) {
      this.connection = connections[this.options.connection];
    }

    _.bindAll(
      this,
      'execute',
      'resolve',
      'reject'
    );

    this._initializeCacher();
  }

  /**************
   * PUBLIC API *
   **************/

  static get(name) {
    if (name && name.constructor && name.constructor._type === 'Request') {
      return name;
    }

    return requests[name];
  }

  /**
   * Validates whether an object contains all properties to be considered a valid {@link Request} implementation.
   * A valid configuration consists of an object containing valid: name, method and route attributes.
   * If connection is specified it has to be valid also (meaning a connection under the that name has to be registered).
   *
   * @memberof Request
   * @method validateImplementation
   * @static
   * @param options {Object} Object containing the implementation for a {@link ClassWithConnection}
   * @param anonymous {Boolean} Indicates whether the request that is passed in to verify is an anonymous request, a request that won't be registered and doesn't need a name
   * @throws Error
   */
  static validateImplementation(options = {}, anonymous = false) {

    if (!anonymous) {
      // name - must be a string, if a request with this name already exists, stop validation,
      // this newly discovered object will be returned, so the rest of the implementation is irrelevant

      if (!options.name) {
        throw new RequestMissingPropertyException('a name property is required');
      }

      if (typeof options.name !== 'string') {
        throw new RequestInvalidPropertyException('name must be a string');
      }

      if (options.shortName === null || typeof options.shortName === 'undefined') {
        throw new RequestMissingPropertyException('a shortName property is required');
      }

      if (typeof options.shortName !== 'string') {
        throw new RequestInvalidPropertyException('shortName must be a string');
      }
    }

    // method - must be a string, capitalized it must match one of the REQUEST_METHODS: GET, POST, PUT or DELETE

    if (options.method === null || typeof options.method === 'undefined') {
      throw new RequestMissingPropertyException('a method property is required');
    }

    if (typeof options.method !== 'string') {
      throw new RequestInvalidPropertyException(`method must be a string`);
    }

    if (!REQUEST_METHODS[options.method.toUpperCase()]) {
      throw new RequestInvalidPropertyException(`'${options.method}' is not a valid method.`);
    }

    // route - must be a string

    if (options.route === null || typeof options.route === 'undefined') {
      throw new RequestMissingPropertyException('a route property is required');
    }

    if (typeof options.route !== 'string') {
      throw new RequestInvalidPropertyException('route must be a string');
    }

    // connection - can be omitted, but, if specified, must be specified as a Connection or a string,
    // if its a string, a Connection with that name must exist

    if (typeof options.connection !== 'undefined' && options.connection !== null) {
      const isConnectionInstance = options.connection.constructor && options.connection.constructor._type === 'Connection';
      let connection = null;

      if (isConnectionInstance) {
        connection = options.connection;
      } else if (typeof options.connection === 'string') {
        connection = connections[options.connection];

        if (!connection) {
          throw new RequestInvalidPropertyException(`connection with name '${options.connection}' doesn't exist`);
        }
      } else {
        throw new RequestInvalidPropertyException('connection must be specified as a string or as an instance of a Connection');
      }

    }
  }

  /**
   * Executes this {@link Request} using it's {@link Connection} or the {@link Connection} specified in the arguments,
   * fills the splats in the route with the data provided.
   *
   * @instance
   * @memberof Request
   * @method execute
   * @param data {Object} Data that has to be sent to the server, this data is also used to fill splats in the routes
   * @param connection {Connection} Connection with which to execute this {@link Request}, defaults to this.connection
   * @returns {Promise}
   * @example
   * request.execute({id: 3})
   *   .then(data => {
   *     console.log(data);
   *   });
   */
  execute(data = {}, connection = this.connection) {
    if (connection === null || !(connection && connection.constructor && connection.constructor._type === 'Connection')) {
      throw new RequestRuntimeException(`Can't execute request, no Connection provided in the arguments and none specified on the Request being executed.`);
    }

    return connection.request(this, data);
  }

  /**
   * Resolve method, for the user to override by specifying it in the options,
   * this method gets executed whenever this {@link Request} resolves.
   *
   * When implemented this method should return a Promise.
   *
   * @method resolve
   * @memberof Request
   * @abstract
   * @instance
   * @param data {*} Data received from the server by executing this {@link Request}
   *
   * @returns {Promise}
   */
  resolve(data) {
    return Promise.resolve(data);
  }

  /**
   * Reject method, for the user to override by specifying it in the options,
   * this method gets executed whenever this {@link Request} rejects.
   *
   * When implemented this method should return a Promise.
   *
   * @method reject
   * @memberof Request
   * @abstract
   * @instance
   * @param data {*} Data received from the server by executing this {@link Request}
   *
   * @returns {Promise}
   */
  reject(data) {
    return Promise.reject(data);
  }

  /***************
   * PRIVATE API *
   ***************/

  static get _type() {
    return 'Request';
  }

  _register(options = {}) {
    Request.validateImplementation(options);

    if (!requests[options.name]) {
      requests[options.name] = this;
    }

    return requests[options.name];
  }

  _initializeCacher() {
    if (this.options.cache) {
      this.cache = new Cacher({
        lifespan: typeof this.options.cache === 'number' ? this.options.cache : 5000,
        execute: this.execute
      });

      this.execute = this.cache.execute;
    }
  }

}

export default Request;