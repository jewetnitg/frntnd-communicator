import events from 'events';

import _ from 'lodash';

import ClassWithPlugins from 'frntnd-class-with-plugins';

import adapters from '../singletons/adapters';
import connections from '../singletons/connections';

import REQUEST_METHODS from '../enums/REQUEST_METHODS';

import routeUtil from 'frntnd-route-util';
import promiseUtil from 'frntnd-promise-util';
import policyExecutor from 'policy-executor';
import Cacher from 'frntnd-cacher';

const EventEmitter = events.EventEmitter;

/**
 * A {@link Request} is a blueprint for a request, after defining one, all you need is the data to execute it.
 *
 * @property name {String} Full name of the request, 'UserLoginRequest' for example
 * @property shortName {String} The short name of this request, 'login' for example
 * @property method {String} The method of this request, 'get' for example
 * @property route {String} The route of the this request, relative to the url of the connection, '/user/:id' for example
 * @property resolve {Function} When specified this method gets called when the request was successful
 * @property reject {Function} When specified this method gets called when the request was unsuccessful
 * @param options {Object} Object containing the properties
 * @class Request
 * @global
 */
class Request extends ClassWithPlugins {

  static get _type() {
    return 'Request';
  }

  constructor(options = {}) {
    super(options);

    _.bindAll(
      this,
      'execute',
      'resolve',
      'reject'
    );

    this.cache = typeof this.cache === 'undefined' ? 2000 : this.cache;

    if (this.cache) {
      this.cacher = new Cacher({
        lifespan: this.cache,
        execute: this.execute
      });

      this.execute = this.cacher.execute;
    }

    if (typeof this.method !== 'string') {
      throw new Error(`Can't construct Request, method should be specified as a string.`);
    }

    const method = REQUEST_METHODS[this.method.toUpperCase()];

    if (!method) {
      throw new Error(`Can't construct Request, method ${this.method} not found.`);
    }

    this._method = method;

    if (!this.route) {
      throw new Error(`Can't construct Request, no route specified.`);
    }

    if (!this.connection) {
      throw new Error(`Can't construct Request, no connection specified.`);
    }

    const connection = connections[this.connection];

    if (!connection) {
      throw new Error(`Can't construct Request, Connection ${this.connection} not found.`);
    }

    this.connection = connection;

    this.hook('afterConstruct');
  }

  get crudAction() {
    return this._method.crudAction;
  }

  /**
   * Executes this {@link Request} using it's {@link Connection}, fills the splats in the route with the data provided.
   * @instance
   * @memberof Request
   * @method execute
   * @param data {Object} Data that has to be sent to the server, this data is also used to fill splats in the routes.
   * @returns {Promise.<T>}
   */
  execute(data) {
    return this.hook('beforeExecute', data)
      .then(() => {
        const url = routeUtil.fillRouteWithPathVariables(this.route, data);

        const request = {
          method: this.method,
          url,
          data
        };

        if (this.policies) {
          return policyExecutor.execute(this.policies)
            .then(() => {
              return this._executeConnection(request);
            },
            (data) => {
              this.trigger(`policy:failure`, {
                data,
                request
              });

              return promiseUtil.reject(data);
            })
        } else {
          return this._executeConnection(request);
        }
      });
  }

  _executeConnection(request) {
    let promise = null;

    if (this.upload) {
      promise = this.connection.upload(request)
        .then(this.resolve, this.reject);
    } else {
      promise = this.connection.request(request)
        .then(this.resolve, this.reject);
    }

    return promise
      .then((data) => {
        return this.hook('afterExecute', data)
          .then(() => {
            return data;
          });
      });
  }

  resolve(data) {
    return promiseUtil.resolve(data);
  }

  reject(data) {
    return promiseUtil.reject(data);
  }

}

export default Request;