module.exports = function (gulp, plugins) {
  gulp.task('dev', function (cb) {
    plugins.sequence(
      // build project
      'build',

      // rebuild on change
      'watch',

      cb
    );
  });
};
