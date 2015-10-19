import events from 'events';

import _ from 'lodash';

import adapters from '../singletons/adapters';
import connections from '../singletons/connections';
import requests from '../singletons/requests';

import REQUEST_METHODS from '../enums/REQUEST_METHODS';

import routeUtil from 'frntnd-route-util';
import policyExecutor from 'policy-executor';
import Cacher from 'frntnd-cacher';

import Connection from './Connection';

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
    const request = this._register(options);

    if (request === this) {
      this.options = options;

      this.method = this.options.method.toUpperCase();

      this.route = this.options.route;
      this.connection = this.options.connection;

      if (this.options.resolve) {
        this.resolve = this.options.resolve;
      }

      if (this.options.reject) {
        this.reject = this.options.reject;
      }

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

    return request;
  }

  /**************
   * PUBLIC API *
   **************/

  /**
   * Validates whether an object contains all properties to be considered a valid {@link Request} implementation.
   * A valid configuration consists of an object containing valid: name, method and route attributes.
   * If connection is specified it has to be valid also (meaning a connection under the that name has to be registered).
   *
   * @memberof Request
   * @method validateImplementation
   * @static
   * @param options {Object} Object containing the implementation for a {@link ClassWithConnection}
   * @throws Error
   */
  static validateImplementation(options) {
    const throwError = (reason) => {
      const baseMessage = `Can't construct Request`;

      if (reason) {
        throw new Error(`${baseMessage} because ${reason}`);
      } else {
        throw new Error(`${baseMessage}.`);
      }
    };

    // name - must be a string, if a request with this name already exists, stop validation,
    // this newly discovered object will be returned, so the rest of the implementation is irrelevant

    if (typeof options.name !== 'string') {
      throwError(`name wasn't specified (as a string).`);
    }

    if (requests[options.name]) {
      return;
    }

    // method - must be a string, capitalized it must match one of the REQUEST_METHODS: GET, POST, PUT or DELETE

    if (typeof options.method !== 'string') {
      throwError(`method wasn't specified (as a string).`);
    }

    if (!REQUEST_METHODS[options.method.toUpperCase()]) {
      throwError(`'${options.method}' is not a valid method.`);
    }

    // route - must be a string

    if (typeof options.route !== 'string') {
      throwError(`route wasn't specified (as a string).`);
    }

    // connection - can be omitted, but, if specified, must be specified as a Connection or a string,
    // if its a string, a Connection with that name must exist

    if (options.connection) {
      let connection = null;

      if (options.connection instanceof Connection) {
        connection = options.connection;
      } else if (typeof options.connection === 'string') {
        connection = connections[options.connection];
      } else {
        throwError(`connection was not specified as a string or an instance of Connection.`);
      }

      if (!connection) {
        throwError(`connection '${options.connection}' was not found.`);
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
    if (connection === null || typeof connection !== 'object') {
      throw new Error(`Can't execute request, no Connection provided in the arguments and none specified on this Request.`);
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