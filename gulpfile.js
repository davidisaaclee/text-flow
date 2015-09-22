'use strict';

var _          = require('lodash');
var gulp       = require('gulp');
var sass       = require('gulp-sass');
var browserify  = require('browserify');
// var coffeeify  = require('gulp-coffeeify');
var coffeeify  = require('coffeeify');
var jade       = require('gulp-jade');
var jasmineBr  = require('gulp-jasmine-browser');
var notify     = require('gulp-notify');
var source     = require('vinyl-source-stream');
var watch      = require('gulp-watch');
var buffer     = require('vinyl-buffer');
var del        = require('del');


var options = {};

options['coffee'] = {
  src: './src/**/*.coffee',
  dst: './build',
  options: {
    debug: true,
    basedir: __dirname + '/src',
    paths: [__dirname + '/node_modules', __dirname + '/src'],
    dest: './build',
    extensions: ['.coffee']
  }
};

options['sass'] = {
  src: './src/**/*.scss',
  dst: './build'
};

options['jade'] = {
  src: './src/**/*.jade',
  dst: './build/',
  options: {
    pretty: true
  }
};

options['jasmine'] = {
  src: './test/test-bundle.js',
  options: {
    verbose: true,
    includeStackTrace: false
  }
};

options['build-tests'] = {
  src: './test/spec/**/*.coffee',
  options: {
    debug: true,
    basedir: __dirname + '/test',
    paths: [
      __dirname + '/node_modules',
      __dirname + '/src',
      __dirname + '/test',
      __dirname + '/test/spec'
    ],
    extensions: ['.coffee'],
    entries: './test-bundle.coffee',
    outputName: 'test-bundle.js',
    transform: [coffeeify]
  }
};

gulp.task('default', ['coffee', 'demo_script', 'jade', 'sass', 'watch']);
gulp.task('coffee', function () {
  var bundle = browserify(_.extend(options.coffee.options, {
    entries: './text-flow.coffee',
    outputName: 'text-flow.js',
    transform: [coffeeify]
  })).bundle();

  bundle
    .on('error', notify.onError({
      title: "CoffeeScript error",
      message: '<%= error.message %>',
      sound: "Frog", // case sensitive
      icon: false
    }))
    .on('error', function (error) {
      console.log(error);
    });

  return bundle
    .pipe(source('text-flow.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./build'));
});

gulp.task('demo_script', function () {
  var bundle = browserify(_.extend(options.coffee.options, {
    entries: './demo/text-flow-demo.coffee',
    outputName: 'text-flow-demo.js',
    transform: [coffeeify]
  })).bundle();

  bundle
    .on('error', notify.onError({
      title: "CoffeeScript error",
      message: '<%= error.message %>',
      sound: "Frog", // case sensitive
      icon: false
    }))
    .on('error', function (error) {
      console.log(error);
    });

  return bundle
    .pipe(source('text-flow-demo.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./build/demo'));
});

gulp.task('sass', function () {
  return gulp.src(options.sass.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(options.sass.dst));
});

gulp.task('jade', function () {
  return gulp.src(options.jade.src)
    .pipe(jade(options.jade.options))
    .pipe(gulp.dest(options.jade.dst))
});

gulp.task('watch', function () {
  gulp.watch(options.coffee.src, ['coffee', 'demo_script']);
  gulp.watch(options.sass.src, ['sass']);
  gulp.watch(options.jade.src, ['jade']);
});


gulp.task('clean', function () {
  del([
    'build/**'
  ]);
});

gulp.task('build-tests', ['coffee'], function () {
  var bundle = browserify(options['build-tests'].options).bundle();

  bundle.on('error', onError);

  return bundle
    .pipe(source('test-bundle.js'))
    .pipe(buffer())
    // .pipe(sourcemaps.init({loadMaps: true}))
    // .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./test'));
});

gulp.task('jasmine', function () {
  return gulp.src(options.jasmine.src)
    .pipe(watch(options.jasmine.src))
    .pipe(jasmineBr.specRunner(options.jasmine.options))
    .pipe(jasmineBr.server({port:8888}));
});

gulp.task('watch-tests', ['coffee', 'build-tests'], function () {
  gulp.watch(options.coffee.src, ['coffee', 'build-tests']);
  gulp.watch(options['build-tests'].src, ['build-tests']);
});


function onError (err) {
  console.log(err);
  notify.onError({
    message: 'Error: <%= error.message %>',
    sound: false // deactivate sound?
  })
  this.emit('end');
}