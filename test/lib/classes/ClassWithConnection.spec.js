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
  let connectionName = null;
  let request = null;

  before((done) => {
    done();
  });

  beforeEach((done) => {
    done();
  });

  it('should be a class', (cb) => {
    expect(ClassWithConnection).to.be.a('function', "ClassWithConnection should be a class");
    cb();
  });

  describe('ClassWithConnection#connect', () => {

  });

});