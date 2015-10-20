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
import ClassWithConnection from '../../../src/lib/classes/ClassWithConnection';

describe('ClassWithConnection', () => {
  let adapter = null;
  let connection = null;

  before((done) => {
    adapter = new Adapter({
      name: 'TEST'
    });

    connection = new Connection({
      name: 'TEST',
      url: 'url',
      adapter: 'TEST'
    });

    done();
  });

  beforeEach((done) => {
    done();
  });

  it('should be a class', (cb) => {
    expect(ClassWithConnection).to.be.a('function', "ClassWithConnection should be a class");
    cb();
  });

  describe('When instantiating', () => {

    it('Should allow me to register Requests', done => {
      const instanceWithConnection = new ClassWithConnection({
        connection: 'TEST'
      });

      const request = instanceWithConnection.registerRequest({
        name: 'test',
        shortName: 'test',
        method: 'get',
        route: 'route'
      });

      expect(instanceWithConnection.requests.test).to.equal(request);

      done();
    });

    it('Should allow me to register Requests by passing in an already instantiated Request', done => {
      const request = new Request({
        name: 'SomeRequest',
        shortName: 'someRequest',
        method: 'get',
        route: 'route'
      });

      const instanceWithConnection = new ClassWithConnection({
        connection: 'TEST'
      });

      instanceWithConnection.registerRequest(request);

      expect(instanceWithConnection.requests.someRequest).to.equal(request.execute);

      done();
    });

    it('Should allow me to pass a key for the attribute Requests registered on this class should be exposed on', done => {
      const instanceWithConnection = new ClassWithConnection({
        connection: 'TEST',
        exposeRequestsOn: 'server'
      });

      const request = instanceWithConnection.registerRequest({
        name: 'test',
        shortName: 'test',
        method: 'get',
        route: 'route'
      });

      expect(instanceWithConnection.server.test).to.equal(request);

      done();
    });

  });

  describe('ClassWithConnection#connect', () => {

  });

});
