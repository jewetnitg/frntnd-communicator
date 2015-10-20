/**
 * @author rik
 */
function AdapterInvalidPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

AdapterInvalidPropertyException.prototype = new Error;
AdapterInvalidPropertyException.prototype.constructor = AdapterInvalidPropertyException;

AdapterInvalidPropertyException.prototype.name = 'AdapterInvalidPropertyException';

export default AdapterInvalidPropertyException;