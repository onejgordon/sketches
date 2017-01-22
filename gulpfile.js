var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var react = require('gulp-react');
var gutil = require('gulp-util');
var resolutions = require('browserify-resolutions');
var hash_src = require("gulp-hash-src");
var assign = require('lodash.assign');
var shell = require('gulp-shell');
var fatalLevel = require('yargs').argv.fatal || "off";
var prod_deploy = require('yargs').argv.prod_deploy || "false";

// Change this to change sketch
var SKETCH = 'js/competition.js';

var ERROR_LEVELS = ['error', 'warning'];
function isFatal(level) {
   return ERROR_LEVELS.indexOf(level) <= ERROR_LEVELS.indexOf(fatalLevel);
};

function handleError(level, error) {
    gutil.log(error.message);
    if (isFatal(level)) {
        process.exit(1);
    }
};

// Convenience handler for error-level errors.
function onError(error) { handleError.call(this, 'error', error); }
// Convenience handler for warning-level errors.
function onWarning(error) { handleError.call(this, 'warning', error); }

var bundles = {
    'app': {
        entry: SKETCH,
        out: 'build.js',
    }
}

var path = {
    BUNDLES: bundles,
    DEST: 'dist',
    BROWSERIFY_PATHS: ['./js', './node_modules'],
    DEST_SRC: 'dist/src'
};

var cache = {};

function get_browserify(bundle_key) {
    if (cache[bundle_key]) {
        return cache[bundle_key];
    }

    var entry = path.BUNDLES[bundle_key].entry;
    var BROWSERIFY_OPTS = {
        entries: [entry],
        debug: true,
        paths: path.BROWSERIFY_PATHS,
        cache: {},
        packageCache: {},
        fullPaths: true,
    };

    var bopts = assign({}, watchify.args, BROWSERIFY_OPTS);

    var b = (
        browserify(bopts)
        .plugin(resolutions, 'react')
        .transform(
            babelify.configure({
                optional: ["es7.decorators", "es7.asyncFunctions", "es7.classProperties"],
                experimental: true,
            })
        )
    );

    cache[bundle_key] = b;
    return b;
};

gulp.task('watch', function() {
    w = watchify(get_browserify('app'));
    w.on('update', bundle.bind(this, 'app')); // on any dep update, runs the bundler
    w.on('log', gutil.log); // output build logs to terminal
});

gulp.task('build_bundle', bundle.bind(this, 'app'));

function bundle(bundle_key) {
    var now = new Date();

    gutil.log(now + ' - building bundle with entry point [ ' + bundle_key + ' ]...');
    var b = get_browserify(bundle_key);
    var out = path.BUNDLES[bundle_key].out;

    var stream = (
        b.bundle()
        .on('error', onError)
        .pipe(source(out))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
    );

    if (process.env.NODE_ENV === 'production') {
        stream = stream.pipe(uglify());
    }

    return (
        stream
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.DEST_SRC))
    );

};

var default_tasks = [
        'build_bundle',
        'watch'
];

gulp.task('default', default_tasks);
