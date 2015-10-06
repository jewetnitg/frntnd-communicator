/**
 * @author rik
 */
import events from 'events';

import _ from 'lodash';
import promiseUtil from 'frntnd-promise-util';

import communicator from '../singletons/communicator';

const EventEmitter = events.EventEmitter;

class ClassWithConnection {

  get connected() {
    return this.connection && this.connection.connected;
  }

  constructor(options = {}) {
    _.extend(this, options);

    if (typeof this.connection !== 'string') {
      throw new Error(`Can't construct ClassWithConnection, no connection specified`);
    }

    if (this.autoConnect) {
      this.connect();
    }

    this._emitter = new EventEmitter();
  }

  on(event, cb) {
    return this._emitter.on(event, cb);
  }

  trigger(event, data) {
    return this._emitter.emit(event, data);
  }

  connect(name = this.connection) {
    if (!this.connected) {
      return communicator.connect(name)
        .then((connection) => {
          this.connection = connection;
          this.trigger('connect', connection);
        });
    } else {
      return promiseUtil.resolve();
    }
  }

}

ClassWithConnection.prototype.autoConnect = true;

export default ClassWithConnection;