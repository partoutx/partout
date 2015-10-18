/*jslint browser: true, node: true, vars: true*/
'use strict';

/*global */
var gulp = require('gulp'),
  mocha = require('gulp-mocha'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  gutil = require('gulp-util'),
  plugins = gulpLoadPlugins(),
  jsdoc = require('gulp-jsdoc');

var env = process.env.NODE_ENV || 'development';
console.log('Invoking gulp -', env);

gulp.task('default', function () {
  plugins.nodemon({
    script: 'bin/serve',
    env: { 'NODE_ENV': env},
    ignore: ['node_modules', 'agent'],
    nodeArgs: ['--debug']
  });
});

gulp.task('mocha', function () {
  return gulp.src(['test/**/*.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should').noConflict()
      }
    }));
});

gulp.task('watch-mocha', function () {
  gulp.watch(['app.js', 'lib/**', 'etc/*.js', 'agent/lib/*.js', 'test/**'], ['mocha']);
});

gulp.task('docs', function () {
  gulp.src(['./app.js', 'lib/**/*.js', 'etc/**/*.p2', './README.md'])
  .pipe(jsdoc(
    './jsdocs',
    {
      path: 'ink-docstrap',
      systemName      : 'Partout',
      footer          : 'Partout',
      copyright       : 'Copyright 2015 Graham Lee Bevan <graham.bevan@ntlworld.com>',
      navType         : 'vertical',
      theme           : 'cerulean',
      linenums        : true,
      collapseSymbols : false,
      inverseNav      : false
    },
    {
      plugins         : ['plugins/markdown']
    }
  ));
});
