/**
 * @author rik
 */
function ClassWithConnectionMissingPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

ClassWithConnectionMissingPropertyException.prototype = new Error;
ClassWithConnectionMissingPropertyException.prototype.constructor = ClassWithConnectionMissingPropertyException;

ClassWithConnectionMissingPropertyException.prototype.name = 'ClassWithConnectionMissingPropertyException';

export default ClassWithConnectionMissingPropertyException;