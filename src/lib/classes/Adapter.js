import events from 'events';

import _ from 'lodash';

import ClassWithPlugins from 'class-with-plugins';

import promiseUtil from 'promise-util';

const EventEmitter = events.EventEmitter;

/**
 * The {@link Adapter} class is an 'abstract' class, it can't be used without further implementation.
 * The properties below should be implemented in an implementation.
 *
 * @abstract
 * @property name {String} The name of the adapter, 'XHR' for example
 * @property connect {Function} Function that connects to the server, takes a url, should return a Promise
 * @property disconnect {Function} Function that disconnects to the server, takes a url, should return a Promise
 * @property subscribe {Function} Function that subscribes to a model on the server, takes a model, should return a Promise
 * @property unsubscribe {Function} Function that unsubscribes from a model on the server, takes a model, should return a Promise
 * @property upload {Function} Function that uploads a file to the server, takes a model, should return a Promise
 * @property request {Function} Function that executes a request to the server, should return a Promise
 * @param options {Object} Object containing the properties
 * @class Adapter
 * @global
 */
class Adapter extends ClassWithPlugins {

  static get _type() {
    return 'Adapter';
  }

  constructor(options) {
    const resolveFn = (method) => {
      console.warn(`${method} method not implemented on adapter ${options.name}`);
      return () => {
        return promiseUtil.resolve();
      };
    };

    options._connect = options.connect || resolveFn('connect');
    delete options.connect;

    options._disconnect = options.disconnect || resolveFn('disconnect');
    delete options.disconnect;

    options._request = options.request || resolveFn('request');
    delete options.request;

    options._upload = options.upload || resolveFn('upload');
    delete options.upload;

    options._subscribe = options.subscribe || resolveFn('subscribe');
    delete options.subscribe;

    options._unsubscribe = options.unsubscribe || resolveFn('unsubscribe');
    delete options.unsubscribe;

    super(options);

    this.hook('afterConstruct')
  }

  /**
   * Connects to a server using a full url (including protocol and port)
   * @instance
   * @memberof Adapter
   * @method connect
   * @param url {String} The url of the server (including protocol and port, eg. http://some.domain.com:1337)
   * @returns {Promise.<T>}
   */
  connect(url) {
    return this.hook('beforeConnect', url)
      .then(() => {
        return this._connect(url)
          .then(() => {
            return this.hook('afterConnect');
          });
      });
  }

  /**
   * Disconnects from a server using a full url (including protocol and port)
   * @instance
   * @memberof Adapter
   * @method disconnect
   * @param url {String} The url of the server (including protocol and port, eg. http://some.domain.com:1337)
   * @returns {Promise.<T>}
   */
  disconnect(url) {
    return this._disconnect(url);
  }

  /**
   * Makes a request to the server
   * @instance
   * @memberof Adapter
   * @method request
   * @param request {Object} Request object, with properties url, method and data
   * @returns {Promise.<T>}
   */
  request(request) {
    return this.hook('beforeRequest', request)
      .then(() => {

        return this._request(request)
          .then((data) => {

            return this.hook('afterRequest', data)
              .then(() => {
                return data;
              });
          });
      });
  }

  /**
   * Uploads files to the server.
   * @instance
   * @memberof Adapter
   * @method upload
   * @param request {Object} Request object, with properties url, method and data
   * @returns {Promise.<T>}
   */
  upload(request) {
    return this._upload(request);
  }

  /**
   * Subscribes to an event on the server
   * @instance
   * @memberof Adapter
   * @method subscribe
   * @param event {String} Event to subscribe to
   * @returns {Promise.<T>}
   */
  subscribe(event) {
    return this._subscribe(event);
  }

  /**
   * Unsubscribes from an event on the server
   * @instance
   * @memberof Adapter
   * @method unsubscribe
   * @param event {String} Event to subscribe to
   * @returns {Promise.<T>}
   */
  unsubscribe(event) {
    return this._unsubscribe(event);
  }

}

export default Adapter;