The frntnd-communicator library needs {@link Adapter}s for {@link Connections}s to be useful,
in this guide we will be setting up an {@link Adapter} that allows us to communicate with a server using XHR.

XHR.js
======
```

import $ from 'jquery';

const XHR = {

  name: 'XHR',

  // XHR connections don't need to 'connect'
  connect(url) {
    return Promise.resolve();
  },

  // XHR connections don't need to 'disconnect'
  disconnect(url) {
    return Promise.resolve();
  },

  // The request object contains a: method, data and url property,
  // $.ajax can do a request using these
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

  // an upload function, designed for sails js
  // sends all files to the server in the 'files' property
  upload(options) {
    return new Promise((resolve, reject) => {
      var formData = new FormData();
      var xhr = new XMLHttpRequest();

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
```


app.js
======
```
import XHR from './XHR';
import communicator from 'frntnd-communicator';

communicator.registerAdapter(XHR);
```