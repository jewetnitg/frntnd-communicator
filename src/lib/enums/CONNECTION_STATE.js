/**
 * @module enums/CONNECTION_STATE
 */

/**
 * Enum representing the states a {@link Connection} can have.
 * @name CONNECTION_STATE
 * @enum CONNECTION_STATE
 * @property DISCONNECTED {Object} Disconnected state
 * @property CONNECTING {Object} Connecting state
 * @property CONNECTED {Object} Connected state
 *
 */
const CONNECTION_STATE = {

  DISCONNECTED: {
    value: 0
  },

  CONNECTING: {
    value: 1
  },

  CONNECTED: {
    value: 2
  }

};

export default CONNECTION_STATE;