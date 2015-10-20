/**
 * @author rik
 */
function ClassWithConnectionInvalidPropertyException(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

ClassWithConnectionInvalidPropertyException.prototype = new Error;
ClassWithConnectionInvalidPropertyException.prototype.constructor = ClassWithConnectionInvalidPropertyException;

ClassWithConnectionInvalidPropertyException.prototype.name = 'ClassWithConnectionInvalidPropertyException';

export default ClassWithConnectionInvalidPropertyException;