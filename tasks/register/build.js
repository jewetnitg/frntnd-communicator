module.exports = function (gulp, plugins) {
  gulp.task('build', function (cb) {
    plugins.sequence(
      // run tests once
      'test',

      // clean build dir
      'clean',
      
      // run browserify
      'browserify',

      // create documentation
      'jsdoc',

      // put the build in an archive
      'tar',

      cb
    );
  });
};
