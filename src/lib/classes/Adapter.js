import _ from 'lodash';

import adapters from '../singletons/adapters';
import AdapterInvalidPropertyException from '../exceptions/AdapterInvalidPropertyException';
import AdapterMissingPropertyException from '../exceptions/AdapterMissingPropertyException';

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
 * // XHR implementation,
 * // this doesn't have subscribe and unsubscribe implemented as this is not functionality of the XHR transport type
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
    const adapter = Adapter.get(options.name || options);

    if (adapter) {
      return adapter;
    }

    this._register(options);

    this.options = options;

    // go through the abstract methods (methods that have to be implemented by providing them in the options object)
    _.each(abstractMethods, (key) => {
      this[`_${key}`] = this.options[key] || resolveFn(key, options);
      this[`_${key}`].bind(this);
    });
  }

  /**************
   * PUBLIC API *
   **************/

  /**
   * Gets an {@link Adapter} instance by name
   * @static
   * @method get
   * @memberof Adapter
   * @param name
   * @returns {Adapter|undefined}
   */
  static get(name) {
    if (name && name.constructor && name.constructor._type === 'Adapter') {
      return name;
    }

    return adapters[name];
  }

  /**
   * Validates if the implementation of an {@link Adapter} is valid
   * @method validateImplementation
   * @static
   * @memberof Adapter
   * @param options
   */
  static validateImplementation(options = {}) {
    if (!options.name) {
      throw new AdapterMissingPropertyException('no name provided');
    }

    if (typeof options.name !== 'string') {
      throw new AdapterInvalidPropertyException('no should be a string');
    }
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
   *
   * @param request {Object} Request object containing the properties listed below
   *
   * @property url {String} full url for the request, including protocol and port
   * @property method {"POST"|"PUT"|"DELETE"|"GET"} http method of the request
   * @property request {Request|Object} Either an instance of {@link Request} or this options object itself
   * @property data {*} Data to send with the request
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
   *
   * @param request {Object} Request object containing the properties listed below
   *
   * @property url {String} full url for the request, including protocol and port
   * @property method {"POST"|"PUT"|"DELETE"|"GET"} http method of the request
   * @property request {Request|Object} Either an instance of {@link Request} or this options object itself
   * @property data {*} Data to send with the request
   *
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

  /***************
   * PRIVATE API *
   ***************/

  static get _type() {
    return 'Adapter';
  }

  _register(options) {
    Adapter.validateImplementation(options);

    if (!adapters[options.name]) {
      adapters[options.name] = this;
    }

    return adapters[options.name];
  }

}

export default Adapter;