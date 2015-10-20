module.exports = function (gulp, plugins) {
  gulp.task('prod', function (cb) {
    plugins.sequence(
      // build the project
      'build',

      // publish documentation on github pages, this only works if you have your git public key on github
      'gh-pages',

      cb
    );
  });
};
