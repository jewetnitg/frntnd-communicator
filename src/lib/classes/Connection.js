import events from 'events'

import _ from 'lodash';

import promiseUtil from 'frntnd-promise-util';
import routeUtil from 'frntnd-route-util';

import ClassWithPlugins from 'frntnd-class-with-plugins';

import adapters from '../singletons/adapters';
import CONNECTION_STATE from '../enums/CONNECTION_STATE';

const EventEmitter = events.EventEmitter;

/**
 * The {@link Connection} class serves to execute {@link Request}s using an {@link Adapter} and some state stored in the {@link Connection} itself (such as the url of the server).
 *
 * @property name {String} Name of the connection, 'local-xhr' for example
 * @property adapter {String} Reference to the name of an {@link Adapter}, 'XHR' for example, the {@link Connection} will use this adapter to execute {@link Request}s
 * @property url {String} The base url of the connection, including protocol and port (if necessary), 'http://localhost:1337' for example
 * @property serverDefinition {String} The route where the serverDefinition can be found, this feature is only useful if you are using the frntnd framework. '/_describe' for example.
 *
 * @param options {Object} Object containing the properties
 * @class Connection
 * @global
 */
class Connection extends ClassWithPlugins {

  static get _type() {
    return 'Connection';
  }

  constructor(options = {}) {
    super(options);

    this._state = CONNECTION_STATE.DISCONNECTED;

    if (typeof this.adapter !== 'string') {
      throw new Error(`Can't construct Connection, adapter should be specified as a string in the options.`);
    }

    if (typeof this.url !== 'string') {
      throw new Error(`Can't construct Connection, url should be specified as a string in the options.`);
    }

    const adapter = adapters[this.adapter];

    if (!adapter) {
      throw new Error(`Can't construct Connection, adapter '${this.adapter}' not found.`);
    }

    this.adapter = adapter;

    this.hook('afterConstruct');
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
   * Connects to the server, executes the beforeConnect and afterConnect hook.
   * @method connect
   * @memberof Connection
   * @instance
   * @returns {Promise.<T>}
   */
  connect() {
    return this.hook('beforeConnect')
      .then(() => {
        let promise = null;
        if (this.connected) {
          promise = promiseUtil.resolve();
        } else if (this.connecting) {
          promise = new Promise((resolve, reject) => {
            this._on('connect', resolve);
            this._on('connectionFail', reject);
          });
        } else {
          promise = this._establishNewConnection();
        }

        return promise
          .then(() => {
            return this.hook('afterConnect');
          });
      });
  }

  _establishNewConnection() {
    this._state = CONNECTION_STATE.CONNECTING;

    return this.adapter.connect(this.url)
      .then(() => {
        this._state = CONNECTION_STATE.CONNECTED;
        this.trigger('connect');

        return promiseUtil.resolve();
      },
      () => {
        this._state = CONNECTION_STATE.DISCONNECTED;
        this.trigger('connectionFail');

        return promiseUtil.reject();
      });
  }

  /**
   * Loads the serverDefinition.
   * @method loadServerDefinition
   * @instance
   * @memberof Connection
   * @returns {Promise}
   */
  loadServerDefinition() {
    if (this.serverDefinition) {
      return this.get(this.serverDefinition);
    } else {
      return promiseUtil.resolve();
    }
  }

  /**
   * Disconnects this {@link Connection}
   * @method disconnect
   * @memberof Connection
   * @instance
   * @returns {Promise.<T>}
   */
  disconnect() {
    return this.adapter.disconnect()
      .then(() => {
        this._state = CONNECTION_STATE.DISCONNECTED;
        return promiseUtil.resolve();
      });
  }

  /**
   * Executes a post request using this {@link Connection}
   * @method post
   * @instance
   * @memberof Connection
   * @param url
   * @param data
   * @returns {Promise}
   */
  post(url, data = {}) {
    return this.request({
      method: 'post',
      url,
      data
    });
  }

  /**
   * Executes a put request using this {@link Connection}
   * @method put
   * @instance
   * @memberof Connection
   * @param url {String}
   * @param data {Object}
   * @returns {Promise}
   */
  put(url, data) {
    return this.request({
      method: 'put',
      url,
      data
    });
  }

  /**
   * Executes a destroy request using this {@link Connection}
   * @method destroy
   * @instance
   * @memberof Connection
   * @param url {String}
   * @param data {Object}
   * @returns {Promise}
   */
  destroy(url, data) {
    return this.request({
      method: 'delete',
      url,
      data
    });
  }

  /**
   * Executes a get request using this {@link Connection}
   * @method get
   * @instance
   * @memberof Connection
   * @param url {String}
   * @param data {Object}
   * @returns {Promise}
   */
  get(url, data) {
    return this.request({
      method: 'get',
      url,
      data
    });
  }

  _on(event, cb) {
    return this._emitter.on(event, cb);
  }

  on(event, cb) {
    return this.adapter.on(event, cb);
  }

  subscribe(model) {
    return this.adapter.subscribe(model);
  }

  unsubscribe(model) {
    return this.adapter.unsubscribe(model);
  }

  /**
   * Executes a request
   * @instance
   * @memberof Connection
   * @method request
   * @param request {Object} Request object
   * @returns {Promise.<T>}
   */
  request(request) {
    return this.hook('beforeRequest', request)
      .then(() => {
        const _request = this._prepareRequest(request);

        return this.adapter.request(_request)
          .then((data) => {
            return this.hook('afterRequest', data)
              .then(() => {
                return data;
              })
          })
      });
  }

  upload(request) {
    const _request = this._prepareRequest(request);
    return this.adapter.upload(_request);
  }

  _prepareRequest(request) {
    const _request = _.clone(request);

    _request.url = routeUtil.concatenateBaseUrlAndUrl(this.url, request.url);

    return _request;
  }

}

export default Connection;