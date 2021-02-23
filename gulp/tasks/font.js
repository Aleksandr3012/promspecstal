module.exports = function () {


	$.gulp.task('font', function () {
		return $.gp.gulp.src(`${$.sourse}/fonts/*.{ttf,woff,otf,woff2}`)
			.pipe($.fontmin())
			.pipe($.gp.gulp.dest('./public/fonts/'));
		// return gulp.src(`${$.sourse}/fonts/*`)
		// 	.pipe(map(function (file, cb) {
		// 		fontfacegen({
		// 			source: file.path,
		// 			dest: './public/fonts/'
		// 		});
		// 		cb(null, file);
			});
}