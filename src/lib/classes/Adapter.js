import _ from 'lodash';

import adapters from '../singletons/adapters';

const resolveFn = (method, options) => {
  return () => {
    console.warn(`${method} method not implemented on adapter ${options.name}`);
    return Promise.resolve();
  };
};

const abstractMethods = [
  'connect',
  'disconnect',
  'request',
  'upload',
  'subscribe',
  'unsubscribe'
];

/**
 * The {@link Adapter} class is an 'abstract' class, it can't be used without further implementation.
 * The properties below should be implemented in an implementation.
 *
 * @abstract
 *
 * @property name {String} The name of the adapter, 'XHR' for example
 * @property connect {Function} Function that connects to the server, takes a url, should return a Promise
 * @property disconnect {Function} Function that disconnects to the server, takes a url, should return a Promise
 * @property subscribe {Function} Function that subscribes to a model on the server, takes a model, should return a Promise
 * @property unsubscribe {Function} Function that unsubscribes from a model on the server, takes a model, should return a Promise
 * @property upload {Function} Function that uploads a file to the server, takes a model, should return a Promise
 * @property request {Function} Function that executes a request to the server, should return a Promise
 *
 * @property options {Object} **SET AUTOMATICALLY** Options object passed into the constructor
 *
 * @param options {Object} Object containing the properties (name, connect, disconnect, subscribe, unsubscribe, upload, request)
 *
 * @class Adapter
 *
 * @see {@link Communicator}
 * @see {@link Connection}
 *
 * @global
 * @example
 * // XHR implementation.
 * // the object passed into the Adapter constructor here is normally passed into
 * // communicator.registerAdapter or ClassWithConnection.registerAdapter
 * const adapter = new Adapter({
 *
 *   name: 'XHR',
 *
 *   connect(url) {
 *     return Promise.resolve();
 *   },
 *
 *   disconnect(url) {
 *     return Promise.resolve();
 *   },
 *
 *   // options consists of a 'data', 'url' and 'method' attribute, enough for $.ajax to work, as well as a 'Request' attribute,
 *   // containing the Request of this request
 *   request(options) {
 *     return new Promise((resolve, reject) => {
 *       $.ajax(options)
 *         .done((data) => {
 *           resolve(data);
 *         })
 *         .fail((data) => {
 *           reject(data);
 *         });
 *     });
 *   },
 *
 *   // upload function designed for sails js,
 *   // sends files as multipart-form to the server in the files property
 *   upload(options) {
 *     return new Promise((resolve, reject) => {
 *       var formData = new FormData();
 *       var xhr = new XMLHttpRequest();
 *
 *       _.each(options.data, (val, key) => {
 *         if (key === 'files') {
 *           if (val instanceof FileList) {
 *             _.each(val, (_val) => {
 *               formData.append('files', _val);
 *             });
 *           } else {
 *             formData.append('files', val);
 *           }
 *         } else {
 *           formData.append(key, val);
 *         }
 *       });
 *
 *       xhr.open(options.method.toUpperCase(), options.url, true);
 *       xhr.send(formData);
 *
 *       xhr.onerror = function (_data) {
 *         reject(_data);
 *       };
 *
 *       xhr.onload = function (_data) {
 *         resolve(_data);
 *       };
 *     });
 *   }
 * });
 */
class Adapter {

  constructor(options = {}) {
    this.options = options;

    // go through the abstract methods (methods that have to be implemented by providing them in the options object)
    _.each(abstractMethods, (key) => {
      this[`_${key}`] = this.options[key] || resolveFn(key, options);
      this[`_${key}`].bind(this);
    });
  }

  /**
   * Registers an {@link Adapter} implementation.
   *
   * @method register
   * @memberof Adapter
   * @static
   * @param options {Object} Object containing the properties (implementation) for an {@link Adapter}
   *
   * @returns {Adapter}
   */
  static register(options) {
    if (adapters[options.name]) {
      throw new Error(`Can't register '${options.name}' adapter, adapter with this name already exists.`);
    }

    adapters[options.name] = new Adapter(options);

    return adapters[options.name];

  }

  /**
   * Connects to a server using a full url (including protocol and port)
   * @instance
   * @memberof Adapter
   * @method connect
   * @param url {String} The url of the server (including protocol and port, eg. http://some.domain.com:1337)
   * @returns {Promise}
   */
  connect(url) {
    return this._connect(url)
  }

  /**
   * Disconnects from a server using a full url (including protocol and port)
   * @instance
   * @memberof Adapter
   * @method disconnect
   * @param url {String} The url of the server (including protocol and port, eg. http://some.domain.com:1337)
   * @returns {Promise}
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
   * @returns {Promise}
   */
  request(request) {
    return this._request(request)
  }

  /**
   * Uploads files to the server.
   * @instance
   * @memberof Adapter
   * @method upload
   * @param request {Object} Request object, with properties url, method and data
   * @returns {Promise}
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
   * @returns {Promise}
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
   * @returns {Promise}
   */
  unsubscribe(event) {
    return this._unsubscribe(event);
  }

}

export default Adapter;