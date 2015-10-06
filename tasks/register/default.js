module.exports = function (gulp, plugins) {
  gulp.task('default', function (cb) {
    plugins.sequence(
      // run the build task
      'build',
      cb
    );
  });
};
