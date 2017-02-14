var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyhtml = require('gulp-minify-html');
var cleanCSS = require('gulp-clean-css');
var sass = require('gulp-sass');
var livereload = require('gulp-livereload');

var srcHomePath = './static/src';
var distHomePath = './static/dist';
var fontHomePath = './static/fonts';

// NO USE
var jsLibPath = './static/lib/js';
var cssLibPath = './static/lib/css'; // 현재 CSS 안씀 (대신 SASS 씀)

var bowerHomePath = './bower_components';

var srcPaths = {
    jslib: [
        bowerHomePath + '/jquery/distHomePath/jquery.min.js',
        bowerHomePath + '/bootstrap-sass/assets/javascripts/bootstrap.min.js',

        // Angular js
        bowerHomePath + '/angular/angular.min.js',
        bowerHomePath + '/angular-route/angular-route.min.js',

        // React js
        bowerHomePath + '/react/react.min.js',
        bowerHomePath + '/react/react-dom.min.js',
        bowerHomePath + '/react/react-dom-server.min.js',
        bowerHomePath + '/react/react-with-addons.min.js',

        // Data Visualization
        bowerHomePath + '/chart.js/distHomePath/Chart.min.js',
        bowerHomePath + '/d3/d3.min.js',

        // Custom files
        srcHomePath + '/js/define.js',
        srcHomePath + '/js/index.js',
        srcHomePath + '/js/route.js'
    ],
    font: [
        bowerHomePath + '/bootstrap-sass/assets/fonts/bootstrap/**.*',
        bowerHomePath + '/font-awesome/fonts/**.*'
    ],
    scss: [
        '.' + bowerHomePath + '/bootstrap-sass/assets/stylesheets',
        '.' + bowerHomePath + '/font-awesome/scss'
    ],
    css: srcHomePath + '/css/**/*.css',
    html: srcHomePath + '/templates/*.html'
};

// sass 파일 css 로 컴파일.
gulp.task('compile-sass', function () {
    return gulp.src(srcHomePath + '/scss/main.scss')
        .pipe(sass({includePaths: srcPaths.scss}))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(concat('main.css'))
        .pipe(gulp.dest(distHomePath + '/'));
});

// 폰트
gulp.task('fonts', function () {
    return gulp.src(srcPaths.font)
        .pipe(gulp.dest(fontHomePath));
});

// js 파일 관련 Task
gulp.task('js-lint', function () {
    return gulp.src(srcPaths.jslib)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// js 파일 합치기
gulp.task('combine-js', ['js-lint'], function () {
    return gulp.src(srcPaths.jslib)
        .pipe(concat('main.js'))
        .pipe(gulp.dest(distHomePath + '/'));
});

// HTML 파일 압축.
gulp.task('compress-html', function () {
    return gulp.src(srcPaths.html)
        .pipe(minifyhtml())
        .pipe(gulp.dest(distHomePath + '/'));
});

// 파일 변경 감지 및 브라우저 재시작
gulp.task('watch', function () {
    livereload.listen();
    gulp.watch(srcPaths.jslib, ['combine-js']);
    gulp.watch(srcPaths.css, ['clean-css']);
    gulp.watch(srcPaths.scss, ['compile-sass']);
    gulp.watch(srcPaths.html, ['compress-html']);
    gulp.watch(distHomePath + '/**').on('change', livereload.changed);
});

gulp.task('default', ['combine-js', 'fonts', 'compile-sass', 'compress-html', 'watch']);

/**
 * TASKS NOT USING
 */
// css 파일 합치기
gulp.task('clean-css', function () {
    return gulp.src(srcPaths.css)
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(concat('main.css'))
        .pipe(gulp.dest(distHomePath + '/css'));
});
