/**
 * @author rik
 */
var Server = require('karma').Server;

module.exports = function (gulp, plugins, growl) {

  gulp.task('test', function (done) {
    new Server({
      configFile: __dirname + '/../../karma.conf.js',
      singleRun: true
    }, done).start();
  });

  gulp.task('test:ci', function (done) {
    new Server({
      configFile: __dirname + '/../../karma.conf.js',
      singleRun: false
    }, done).start();
  });

};