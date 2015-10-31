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

import RequestRuntimeException from '../../../src/lib/exceptions/RequestRuntimeException';

describe('Request', () => {
  let adapter = null;
  let connection = null;

  beforeEach((done) => {
    adapter = new Adapter({
      name: 'TEST'
    });

    connection = new Connection({
      name: 'test-connection',
      adapter: 'TEST',
      url: 'http://localhost:1337'
    });

    done();
  });

  it('should be a class', (cb) => {
    expect(Request).to.be.a('function', "Request should be a class");
    cb();
  });

  it('should register itself when instantiated', (cb) => {
    const request = new Request({
      name: 'testA',
      shortName: 'test',
      method: 'get',
      route: '/route'
    });

    expect(communicator.requests.testA).to.equal(request);

    cb();
  });

  it('should return an already existing instance if a Request if instantiated with the same name', (cb) => {
    const req1 = new Request({
      name: '1',
      shortName: '1',
      connection: 'test-connection',
      method: 'get',
      route: '/route/:splat'
    });

    const req2 = new Request({
      name: '1',
      shortName: '1',
      connection: 'test-connection',
      method: 'get',
      route: '/route/:splat'
    });

    expect(req1).to.equal(req2, 'When instantiating another Request with the same name the first registered Request should be returned.');
    cb();
  });

  describe('Request#execute', () => {

    it(`should request its data using its connection`, (done) => {
      const request = new Request({
        name: 'TestRequest',
        shortName: 'test',
        method: 'get',
        connection: 'test-connection',
        route: '/route/:splat'
      });

      const expected = 'data from Connection#request';

      request.connection = {
        constructor: {
          _type: 'Connection'
        },
        request: mockFunction()
      };

      when(request.connection.request)(request, anything())
        .thenReturn(Promise.resolve(expected));

      request.execute()
        .then(actual => {
          expect(actual).to.equal(expected);
          done();
        });
    });

    it(`should use its connection to execute itself`, (done) => {
      const request = new Request({
        name: 'TestRequest',
        shortName: 'test',
        method: 'get',
        connection: 'test-connection',
        route: '/route/:splat'
      });

      const expected = 'data from Connection#request';

      request.connection = {
        constructor: {
          _type: 'Connection'
        },
        request: mockFunction()
      };

      when(request.connection.request)(request, anything())
        .thenReturn(Promise.resolve(expected));

      request.execute()
        .then(actual => {
          expect(actual).to.equal(expected);
          done();
        });
    });

    it(`should be able to execute itself using a different connection`, (done) => {
      const request = new Request({
        name: 'TestRequest',
        shortName: 'test',
        method: 'get',
        connection: 'test-connection',
        route: '/route/:splat'
      });

      const expected = 'data from Connection#request';
      const connection = {
        constructor: {
          _type: 'Connection'
        },
        request: mockFunction()
      };

      request.connection = null;

      when(connection.request)(request, anything())
        .thenReturn(Promise.resolve(expected));

      request.execute({}, connection)
        .then(actual => {
          expect(actual).to.equal(expected);
          done();
        });
    });

    it(`should fail to execute if no connection is on the request, nor provided through the arguments`, (done) => {
      const request = new Request({
        name: 'TestRequest',
        shortName: 'test',
        method: 'get',
        route: '/route/:splat'
      });

      expect(request.execute).to.throw(RequestRuntimeException);

      done();
    });

  });

});
