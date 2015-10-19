/**
 * @author rik
 */
function RequestRuntimeException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

RequestRuntimeException.prototype = new Error;
RequestRuntimeException.prototype.constructor = RequestRuntimeException;

RequestRuntimeException.prototype.name = 'RequestRuntimeException';

export default RequestRuntimeException;