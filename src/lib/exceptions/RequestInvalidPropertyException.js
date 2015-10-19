/**
 * @author rik
 */
function RequestInvalidPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

RequestInvalidPropertyException.prototype = new Error;
RequestInvalidPropertyException.prototype.constructor = RequestInvalidPropertyException;

RequestInvalidPropertyException.prototype.name = 'RequestInvalidPropertyException';

export default RequestInvalidPropertyException;