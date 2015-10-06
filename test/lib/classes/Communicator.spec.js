/**
 * @author rik
 */
import _ from 'lodash';
import $ from 'jquery';

import singleton from '../../../src/lib/singletons/communicator';
import _requests from '../../../src/lib/singletons/requests';
import _adapters from '../../../src/lib/singletons/adapters';
import _connections from '../../../src/lib/singletons/connections';
import index from '../../../index';

describe('Communicator', () => {

  it('should export the communicator singleton', (cb) => {
    expect(index).to.equal(singleton, "npm module doesn't export the communicator singleton.");
    cb();
  });

  describe('Communicator#registerConnection', () => {

    it('Should not allow me to register a connection when the adapter for it doesn\'t exist', () => {
      function fn() {
        return singleton.registerConnection({
          url: 'http://localhost:1337',
          name: 'local-xhr',
          adapter: 'XHR'
        });
      }

      expect(fn).to.throw(Error);
    });

    it('Should allow me to register a connection when the adapter for it exists', () => {
      const _ts = new Date().getTime();
      const adapterName = `adapter_${_ts}`;

      singleton.registerAdapter({
        name: adapterName
      });

      singleton.registerConnection({
        url: 'http://localhost:1337',
        name: 'local-xhr',
        adapter: adapterName
      });

      expect(_adapters[adapterName]).to.be.defined;
      expect(_connections['local-xhr']).to.be.defined;
    });

  });

  describe('Communicator#registerAdapter', () => {

    it('Should allow me to register an adapter', (done) => {
      const _ts = new Date().getTime();
      const adapterName = `adapter_${_ts}`;

      singleton.registerAdapter({
        name: adapterName
      });

      expect(_adapters[adapterName]).to.be.defined;

      done();
    });

  });

  describe('Communicator#registerRequest', () => {

    it('Should allow me to register a request ', (done) => {
      singleton.registerRequest({
        name: 'TestRequest',
        connection: 'local-xhr',
        shortName: 'test',
        method: 'post',
        route: '/test/:test'
      });

      done();
    });

  });

});
