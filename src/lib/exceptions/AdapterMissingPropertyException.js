/**
 * @author rik
 */
function AdapterMissingPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

AdapterMissingPropertyException.prototype = new Error;
AdapterMissingPropertyException.prototype.constructor = AdapterMissingPropertyException;

AdapterMissingPropertyException.prototype.name = 'AdapterMissingPropertyException';

export default AdapterMissingPropertyException;