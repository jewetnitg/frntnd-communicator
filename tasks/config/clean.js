var rimraf = require('rimraf');

module.exports = function (gulp, plugins, growl) {
  gulp.task('clean', function (cb) {
    return rimraf('build', cb);
  });
};
