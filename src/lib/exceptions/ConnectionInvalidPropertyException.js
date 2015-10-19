/**
 * @author rik
 */
function ConnectionInvalidPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

ConnectionInvalidPropertyException.prototype = new Error;
ConnectionInvalidPropertyException.prototype.constructor = ConnectionInvalidPropertyException;

ConnectionInvalidPropertyException.prototype.name = 'ConnectionInvalidPropertyException';

export default ConnectionInvalidPropertyException;