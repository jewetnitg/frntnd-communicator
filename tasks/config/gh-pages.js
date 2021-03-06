var shell = require('gulp-shell');
var path = require('path');

module.exports = function (gulp, plugins, growl) {

  gulp.task('gh-pages', shell.task([
    'rm -rf .publish',
    'git clone ' + path.resolve(process.cwd()) + ' .publish',
    'cd .publish && '
    + 'git remote remove origin && '
    + 'git remote add origin git@github.com:jewetnitg/frntnd-communicator.git && '
    + 'git push origin --delete gh-pages && '
    + 'git checkout --orphan gh-pages && '
    + 'git rm -rf . && '
    + 'cp -R ../build/docs/. . && '
    + 'git add -A && '
    + 'git commit -m "gh-pages committed from build" && '
    + 'git push origin gh-pages'
  ]));

};
