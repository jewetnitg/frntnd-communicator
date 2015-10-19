/**
 * @author rik
 */
function RequestMissingPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

RequestMissingPropertyException.prototype = new Error;
RequestMissingPropertyException.prototype.constructor = RequestMissingPropertyException;

RequestMissingPropertyException.prototype.name = 'RequestMissingPropertyException';

export default RequestMissingPropertyException;