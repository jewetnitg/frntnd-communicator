/**
 * @author rik
 */
function CommunicatorInvalidPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

CommunicatorInvalidPropertyException.prototype = new Error;
CommunicatorInvalidPropertyException.prototype.constructor = CommunicatorInvalidPropertyException;

CommunicatorInvalidPropertyException.prototype.name = 'CommunicatorInvalidPropertyException';

export default CommunicatorInvalidPropertyException;