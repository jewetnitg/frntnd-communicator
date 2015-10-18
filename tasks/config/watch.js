/**
 * @author rik
 */

module.exports = function (gulp, plugins, growl) {
  gulp.task('watch', function (cb) {
    gulp.watch('./src/**/*.*', ['build']);
  });
};
