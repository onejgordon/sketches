var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var SKETCH = 'dandelion.js'; // << Edit this

gulp.task('default', function () {
    var bundler = browserify({
        entries: 'js/' + SKETCH,
        debug: true
    });
    bundler.transform("babelify", {presets: ["es2015", "react"]});

    bundler.bundle()
        .on('error', function (err) { console.error(err); })
        .pipe(source(SKETCH))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify()) // Use any gulp plugins you want now
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
});