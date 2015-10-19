/**
 * @author rik
 */
import _ from 'lodash';
import $ from 'jquery';

import communicator from '../../../src/lib/singletons/communicator';

import _requests from '../../../src/lib/singletons/requests';
import _adapters from '../../../src/lib/singletons/adapters';
import _connections from '../../../src/lib/singletons/connections';

import Request from '../../../src/lib/classes/Request';
import Adapter from '../../../src/lib/classes/Adapter';
import Connection from '../../../src/lib/classes/Connection';

import ConnectionInvalidPropertyException from '../../../src/lib/exceptions/ConnectionInvalidPropertyException';
import ConnectionMissingPropertyException from '../../../src/lib/exceptions/ConnectionMissingPropertyException';

import RequestInvalidPropertyException from '../../../src/lib/exceptions/RequestInvalidPropertyException';
import RequestMissingPropertyException from '../../../src/lib/exceptions/RequestMissingPropertyException';

describe('Connection', () => {
  const validRequest = {
    route: '/route/:splat',
    method: 'get'
  };
  let adapter = null;
  let connection = null;

  before((done) => {
    adapter = communicator.registerAdapter({
      name: 'TEST'
    });

    connection = communicator.registerConnection({
      name: 'test-connection',
      adapter: 'TEST',
      url: 'http://localhost:1337'
    });
    done()
  });

  beforeEach((done) => {
    connection.adapter = adapter;
    done();
  });

  it('should be a class', (cb) => {
    expect(Connection).to.be.a('function', "Connection should be a class");
    cb();
  });

  it('should register itself when instantiated', (cb) => {
    const connection = new Connection({
      name: 'someTestConnection',
      url: 'someUrl',
      adapter: 'TEST'
    });

    expect(communicator.connections.someTestConnection).to.equal(connection);

    cb();
  });

  it('should return an already existing instance if a Connection if instantiated with the same name', (cb) => {
    const conn1 = new Connection({
      name: '1',
      adapter: 'TEST',
      url: '123'
    });

    const conn2 = new Connection({
      name: '1',
      adapter: 'TEST',
      url: '123'
    });

    expect(conn1).to.equal(conn2, 'When instantiating another Connection with the same name the first registered Connection should be returned.');
    cb();
  });

  describe('Connection#request', () => {

    it(`It should throw an error when trying to execute a request without a route`, (done) => {
      expect(() => {
        connection.request({
          method: 'get'
        })
      }).to.throw(RequestMissingPropertyException);

      done();
    });

    it(`It should throw an error when trying to execute a request without a method`, (done) => {
      expect(() => {
        connection.request({
          route: '/route/:splat'
        })
      }).to.throw(RequestMissingPropertyException);

      done();
    });

    it(`It should throw an error when trying to execute a request with an invalid method`, (done) => {
      const method = 'asd';

      expect(() => {
        connection.request({
          route: '/route/:splat',
          method
        })
      }).to.throw(RequestInvalidPropertyException);

      done();
    });

    it(`It should use its Adapter to execute the request`, (done) => {
      const expected = 'result';
      const mockedAdapter = mock(adapter);

      connection.adapter = mockedAdapter;

      when(mockedAdapter)
        .request(anything())
        .thenReturn(Promise.resolve(expected));

      connection.request(validRequest, {data: 'data'})
        .then(actual => {
          expect(actual).to.equal(expected);
          done();
        });
    });

  });

});
