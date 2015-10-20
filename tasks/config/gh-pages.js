var shell = require('gulp-shell');
var path = require('path');

module.exports = function (gulp, plugins, growl) {

  gulp.task('gh-pages', shell.task([
    'rm -rf .publish',
    'mkdir .publish',
    'git clone ' + path.resolve(process.cwd()) + ' .publish',
    'cd .publish && '
    + 'git checkout gh-pages && '
    + 'git rm -rf . && '
    + 'cp -R ../build/docs/. . && '
    + 'git add -A && '
    + 'git commit -m "gh-pages committed from build" && '
    + 'git push origin gh-pages',
    'rm -rf .publish'
  ]));

};
