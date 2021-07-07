"use strict";

/* Подключаем модули */
const {
	src,
	dest
} = require('gulp');
const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer"); // расставляет префиксы для поддержки свойств в разных браузерах
const groupmedia = require("gulp-group-css-media-queries");
const cleancss = require("gulp-clean-css");
const rename = require("gulp-rename"); // для переименования файлов
const fileinclude = require('gulp-file-include'); //"склеивает" несколько файлов в один
const del = require("del"); // для удаления файлов и папок
const browsersync = require("browser-sync").create(); // для запуска сервера и перезагрузки страницы при внесении изменений
const sass = require("gulp-sass"); // для компиляции sass в css
const uglify = require("gulp-uglify-es").default; // для минификации (сжатия) js-кода. Обратного преобразования нет.
const imagemin = require("gulp-imagemin"); //для минификации изображений
const webp = require("gulp-webp");
const webphtml = require("gulp-webp-html");
const webpcss = require("gulp-webpcss");
const svgSprite = require("gulp-svg-sprite");


/* Пути */
const distPath = "dist/";
const srcPath = "src/";


let fs = require("fs");


let path = {
	build: {
		/* В эти папки будут собираться файлы */
		html: distPath,
		css: distPath + "assets/css/",
		js: distPath + "assets/js/",
		img: distPath + "assets/images/",
		fonts: distPath + "assets/fonts/",
	},
	/* Исходные файлы. С этими файлами мы будем работать */
	src: {
		html: [srcPath + "*.html", "!" + srcPath + "_*.html"],
		scss: srcPath + "assets/scss/style.scss",
		js: srcPath + "assets/js/script.js",
		img: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp}",
		fonts: srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}",
	},
	/* За этими файлами мы будем следить. При изменении этих файлов бдет перезагружаться браузер */
	watch: {
		html: srcPath + "**/*.html",
		css: srcPath + "assets/scss/**/*.scss",
		js: srcPath + "assets/js/**/*.js",
		img: srcPath + "assets/img/**/*.{jpg,png,svg,gif,ico,webp}"
	},
	clean: "./" + distPath
}



/* Tasks */

/* Запуск локального сервера */
function browserSync() {
	browsersync.init({
		server: {
			baseDir: "./" + distPath + "/"
		},
		port: 3000,
		notify: false
	});
}

/* Для HTML */
function html() {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(webphtml())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream())
}

/* Для CSS */
function css() {
	return src(path.src.scss)
		.pipe(
			sass({
				outputStyle: "expanded"
			})
		)
		.pipe(
			groupmedia()
		)
		.pipe(
			autoprefixer({
				overrideBrowserslist: ["last 5 versions"],
				cascade: true
			})
		)
		.pipe(webpcss())
		.pipe(dest(path.build.css))
		.pipe(cleancss())
		.pipe(
			rename({
				extname: ".min.css"
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
}

/* Для JS */
function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		.pipe(dest(path.build.js))
		.pipe(
			uglify()
		)
		.pipe(
			rename({
				extname: ".min.js"
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream())
}

/* Для изображений */
function images() {
	return src(path.src.img)
		.pipe(
			webp({
				quality: 80
			})
		)
		.pipe(dest(path.build.img))
		.pipe(src(path.src.img))
		.pipe(
			imagemin({
				progressive: true,
				svgPlugins: [{
					removeViewBox: false
				}],
				interlaced: true,
				optimizationLevel: 3
			})
		)
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream())
}


/* Для шрифтов */
function fonts() {
	return src(path.src.fonts)
		.pipe(dest(path.build.fonts))
}



gulp.task('svgSprite', function () {
	return gulp.src([srcPath + '/iconsprite/*.svg'])
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: "../icons/icons.svg",
					// example: true
				}
			}
		}))
		.pipe(dest(path.build.img))
})






/* При сборке проекта удаляет папку dist и создает новую со свежими файлами */
function clean() {
	return del(path.clean);
}



/* Для слежки за файлами */
function watchFiles() {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts)); /* Будет запускаться по команде gulp build */
let watch = gulp.parallel(build, watchFiles, browserSync); /* Будет запускаться по дефолтной команде gulp */





/* Экспорты Tasks */
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;





// У кого проблемы с плагином WEBPCSS нужно установить converter командой -
// npm install webp-converter@2.2.3 --save-dev
// Мне помогло