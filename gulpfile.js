'use strict';

var browserify = require('browserify')
    , clean = require('gulp-clean')
    , connect = require('gulp-connect')
    , proxy = require('http-proxy-middleware')
    , concat = require('gulp-concat')
    , eslint = require('gulp-eslint')
    , glob = require('glob')
    , gulp = require('gulp')
    , karma = require('gulp-karma')
    , mocha = require('gulp-mocha')
    , protractor = require('gulp-protractor').protractor
    , sass = require('gulp-sass')
    , sourcemaps = require('gulp-sourcemaps')
    , autoprefixer = require('gulp-autoprefixer')
    , source = require('vinyl-source-stream')
    , streamify = require('gulp-streamify')
    , uglify = require('gulp-uglify');

var ngAnnotate = require('gulp-ng-annotate');

/*
 * Useful tasks:
 * - gulp fast:
 *   - linting
  *   - browserification
 *   - no minification, does not start server.
 * - gulp watch:
 *   - starts server with live reload enabled
 *   - lints, browserifies and live-reloads changes in browser
 *   - no minification
 * - gulp:
 *   - linting
 *   - browserification
 *   - minification and browserification of minified sources
 *
 * At development time, you should usually just have 'gulp watch' running in the
 * background all the time. Use 'gulp' before releases.
 */

var liveReload = true;
var backend = "http://192.168.1.3:8090";

var getBundleName = function () {
    var version = require('./package.json').version;
    var name = require('./package.json').name;
    return version + '.' + name + '.' + 'min';
};

gulp.task('clean', function () {
    return gulp.src(['./app/ngmin', './app/dist'], { read: false })
        .pipe(clean());
});

gulp.task('lint', function () {
    return gulp.src(['app/scripts/**/*.js',
        '!app/scripts/bower_components/**/*.js',
        '!app/scripts/vendor/*.js'])
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task('browserify', /*['lint', 'unit'],*/ function () {
    var bundler = browserify({
        entries: ['./app/scripts/app.js'],
        debug: true
    });

    var bundle = function () {
        return bundler
            .bundle()
            .pipe(source('app.js'))
            .pipe(gulp.dest('./app/dist/'))
            .pipe(connect.reload());
    };

    return bundle();
});

gulp.task('ngannotate', function () {
    return gulp.src(['./app/scripts/**/*.js', '!./app/scripts/bower_components/**'])
        .pipe(ngAnnotate())
        .pipe(gulp.dest('./app/ngannotate'));
});

gulp.task('browserify-min', ['ngannotate'], function () {
    return browserify('./app/ngannotate/app.js')
        .bundle()
        .pipe(source('app.min.js'))
        .pipe(streamify(uglify({ mangle: false })))
        .pipe(gulp.dest('./app/dist/'));
});

gulp.task('server', ['browserify'], function () {
    connect.server({
        root: 'app',
        port: 8091,
        livereload: liveReload,
        middleware: function (connect, opt) {
            return [
                proxy('/api', {
                    target: backend,
                    changeOrigin: true
                })
            ]
        }
    });
});

gulp.task('sass', function () {
    return gulp.src('app/styles/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.init())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concat('main.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('app/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('app/styles/*.scss', ['sass']);
});

gulp.task('watch', function () {
    gulp.start('server');
    gulp.watch([
        'app/scripts/**/*.js',
        '!app/scripts/bower_components/**',
    ], ['fast']);
    gulp.watch('app/styles/*.scss', ['sass']);
});

gulp.task('fast', ['clean'], function () {
    gulp.start('browserify');
});

gulp.task('default', ['clean'], function () {
    liveReload = false;
    gulp.start('browserify', 'browserify-min', 'sass');
});

gulp.task('javascript', function () {

    var bundler = browserify({
        entries: ['./app/scripts/app.js'],
        debug: true
    });

    var bundle = function () {
        return bundler
            .bundle()
            .pipe(source(getBundleName() + '.js'))
            // .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            // Add transformation tasks to the pipeline here.
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./app/dist/'));
    };

    return bundle();
});
