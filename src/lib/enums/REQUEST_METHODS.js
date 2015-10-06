import CRUD_ACTIONS from './CRUD_ACTIONS';

const REQUEST_METHODS = {

  POST: {
    value: 'POST',
    crudAction: CRUD_ACTIONS.CREATE
  },
  
  PUT: {
    value: 'PUT',
    crudAction: CRUD_ACTIONS.UPDATE
  },

  GET: {
    value: 'GET',
    crudAction: CRUD_ACTIONS.READ
  },

  DELETE: {
    value: 'DELETE',
    crudAction: CRUD_ACTIONS.DELETE
  }

};

export default REQUEST_METHODS;