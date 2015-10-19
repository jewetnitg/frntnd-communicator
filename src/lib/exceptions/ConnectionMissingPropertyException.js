/**
 * @author rik
 */
function ConnectionMissingPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

ConnectionMissingPropertyException.prototype = new Error;
ConnectionMissingPropertyException.prototype.constructor = ConnectionMissingPropertyException;

ConnectionMissingPropertyException.prototype.name = 'ConnectionMissingPropertyException';

export default ConnectionMissingPropertyException;