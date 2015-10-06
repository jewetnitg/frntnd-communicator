var browserify = require('browserify');

var babel = require('babelify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var sourcemaps = require('gulp-sourcemaps');

var browserifyConfig = require('../../browserify.config');

module.exports = function (gulp, plugins, growl) {
  gulp.task('browserify', function () {
    var bundler = browserify(browserifyConfig)
      .transform(babel);

    return bundler.bundle()
      .on('error', function (err) {
        console.error(err);
        this.emit('end');
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps: true
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./build/dst'));
  });
};