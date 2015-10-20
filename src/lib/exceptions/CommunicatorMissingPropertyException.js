/**
 * @author rik
 */
function CommunicatorMissingPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

CommunicatorMissingPropertyException.prototype = new Error;
CommunicatorMissingPropertyException.prototype.constructor = CommunicatorMissingPropertyException;

CommunicatorMissingPropertyException.prototype.name = 'CommunicatorMissingPropertyException';

export default CommunicatorMissingPropertyException;