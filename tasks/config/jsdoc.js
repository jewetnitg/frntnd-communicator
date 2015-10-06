var shell = require("gulp-shell");

module.exports = function (gulp, plugins, growl) {
  return gulp.task('jsdoc', shell.task('./node_modules/.bin/jsdoc ./src -c ./jsdoc.config.json -R ./docs/README.md'));
};
