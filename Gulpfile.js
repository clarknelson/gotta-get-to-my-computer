'use strict';

var gulp    = require('gulp');
var gutil   = require('gulp-util');

// Load plugins:
var plugins = require('gulp-load-plugins')({
  pattern: [
    'gulp-*',
    'gulp.*',
    'browserify',
    'babelify',
    'vinyl-source-stream',
    'vinyl-buffer',
    'browser-sync'
  ]
});

// Source and destination paths for tasks:
var path = {
  src:   'src',
  dest:  'public',
  npm:   'node_modules',
  // Path to /app/public on the staging environment (for rsync):
  stage: 'user@servername:/path/to/site/app/public'
};

/**
 * $ gulp
 *
 * - compile, autoprefix, and minify Sass
 * - bundle Javascript
 * - optimise images (including SVGs)
 * - create custom Modernizr build
 */
gulp.task('default', [
  'styles',
  'scripts',
  'modernizr'
]);

/**
 * $ gulp watch:tasks
 *
 * - watch for updates to scripts, styles, and Gulpfile
 * - process files appropriately on change
 */
gulp.task('watch:tasks', ['default'], function(){
  // Gulpfile.js:
  gulp.watch('Gulpfile.js', [
    'jshint'
  ]);

  // Scripts:
  gulp.watch(path.src + '/scripts/**/*.js', [
    'jshint',
    'scripts'
  ]);

  // Styles:
  gulp.watch(path.src + '/styles/**/*.scss', [
    'styles'
  ]);
});

/**
 * $ gulp watch
 *
 * - calls 'gulp watch:tasks' using Browsersync for live updating
 */
gulp.task('watch', ['watch:tasks'], function() {
  // Connect to craft.dev via BrowserSync:
  plugins.browserSync.init({
    open: 'local', //options: false, 'local', 'external', 'ui', 'tunnel'
    server: '.',
    logPrefix: '3eleven',
    logLevel: 'debug', //options: 'info', 'debug', 'warn', 'silent'
    logConnections: true,
    logFileChanges: true
  });

  // Do a full page reload when any templates are updated:
  gulp.watch([
    './**/*.html'
  ])
  .on('change', plugins.browserSync.reload);
});

/**
 * $ gulp styles
 *
 * - Compile Sass --> CSS, autoprefix, and minify
 */
gulp.task('styles', function(){
  gulp.src(path.src + '/styles/main.scss')
    // Compile Sass:
    .pipe(plugins.sass.sync({})
      .on('error', plugins.sass.logError)
    )
    // Autoprefix:
    .pipe(plugins.autoprefixer({
      browsers: [
        'last 3 versions',
        'ie 8',
        'ie 9'
      ]
    }))
    // Write main.css
    .pipe(gulp.dest(path.dest + '/styles'))
    .pipe(plugins.browserSync.stream())
    // Report file size:
    .pipe(plugins.size({ showFiles: true }))
    // Minify main.css and rename it to 'main.min.css':
    .pipe(plugins.cssmin())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(plugins.size({ showFiles: true }))
    .pipe(gulp.dest(path.dest + '/styles'))
    .pipe(plugins.browserSync.stream())
    .on('error', gutil.log);
});

/**
 * $ gulp scripts
 *
 * - Bundle Javascript with Browserify
 */
gulp.task('scripts', function(){
  var bundler = plugins.browserify(path.src + '/scripts/main.js');

  bundler.transform(plugins.babelify, {
      presets: ['es2015']
    })
    .bundle()
    .on('error', gutil.log)
    // Vinyl source stream and buffer turn the output of Browserify
    // into a stream that can be piped into subsequent Gulp tasks:
    .pipe(plugins.vinylSourceStream('bundle.js'))
    .pipe(plugins.vinylBuffer())
    .pipe(gulp.dest(path.dest + '/scripts'))
    .pipe(plugins.browserSync.stream())
    .pipe(plugins.size({ showFiles: true }));
});

/**
 * $ gulp jshint
 *
 * - lint Javascript files and Gulpfile.js
 */
gulp.task('jshint', function(){
  var src  = [
    'Gulpfile.js',
    path.src  + '/scripts/{,*/}*.js',
    '!' + path.src  + '/scripts/vendor/{,*/}*.js'
  ];

  gulp.src(src)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter(require('jshint-stylish')));
});

/**
 * $ gulp modernizr
 *
 * - create a custom Modernizr build based on tests used
 *   in bundle.js and main.css
 */
gulp.task('modernizr', function(){
  var src = [
    path.dest + '/scripts/bundle.js',
    path.dest + '/styles/main.css'
  ];

  gulp.src(src)
    .pipe(plugins.modernizr({
      options: [
        'setClasses'
      ]
    }))
    .pipe(plugins.uglify())
    .pipe(gulp.dest(path.dest + '/scripts'))
    .pipe(plugins.size({ showFiles: true }))
    .on('error', gutil.log);
});
