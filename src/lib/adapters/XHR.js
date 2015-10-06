import $ from 'jquery';

import promiseUtil from 'promise-util';

const XHR = {

  connect(url) {
    return promiseUtil.resolve();
  },

  disconnect(url) {
    return promiseUtil.resolve();
  },

  request(options) {
    return new Promise((resolve, reject) => {
      $.ajax(options)
        .done((data) => {
          resolve(data);
        })
        .fail((data) => {
          reject(data);
        });
    });
  },

  upload(options) {
    return new Promise((resolve, reject) => {
      var formData = new FormData();
      var xhr = new XMLHttpRequest();

      /* Required for large files */
      //xhr.setRequestHeader('X-CSRF-Token', csrfToken);

      _.each(options.data, (val, key) => {
        if (key === 'files') {
          if (val instanceof FileList) {
            _.each(val, (_val) => {
              formData.append('files', _val);
            });
          } else {
            formData.append('files', val);
          }
        } else {
          formData.append(key, val);
        }
      });

      //formData.append('_csrf', csrfToken);

      xhr.open(options.method.toUpperCase(), options.url, true);
      xhr.send(formData);

      xhr.onerror = function (_data) {
        reject(_data);
      };

      xhr.onload = function (_data) {
        resolve(_data);
      };
    });
  }

};

export default XHR;