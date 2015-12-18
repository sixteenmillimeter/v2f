var exec = require('child_process').exec,
	fs = require('fs'),
	_tmp = './temp';

//var frame_height = 7.61;
//var frame_height = 7.49;
var frame_height = 7.62;
var frame_padding = 0;

var frame_dimensions = function (dpi) {
	var h = Math.round(frame_height * (dpi / 25.4)),
		w = Math.round(10.5 * (dpi / 25.4)),
		o = Math.round(16 * (dpi / 25.4));
	return {h: h, w: w, o: o, dpi: dpi};
};

/*
convert() - Turn video into sheet of images

@param: path - file path (absolute)
@param: dpi - target printing dpi
@param: length - strip length in frames

*/
var convert = function (path, dpi) {
	'use strict';
	var dim = frame_dimensions(dpi),
		file = path.split('/').pop(),
		loc = _tmp + '/',
		execStr = 'avconv -i "' + path + '" -s ' + dim.w + 'x' + dim.h + ' -qscale 1 "' + loc + 'sequence_%04d.jpg"';

	console.log('Converting ' + file + '...');
	console.log('Exporting all frames with aspect ratio: ' + (dim.w / dim.h) + '...');

	fs.mkdirSync(_tmp);

	exec(execStr, function (ste, std) {
		if (ste) {
			return errorHandle(ste);
		}
		console.log('Frames exported successfully!');
		stitch(loc.substring(0, loc.length - 1), dim);
	});
};

var stitch = function (loc, dim) {
	'use strict';
	var length = Math.floor((11 * dim.dpi) / dim.h) - 1,
		width = Math.floor((8.5 * dim.dpi / dim.o)) - 1,
		page = 0,
		pageCount = 0,
		cmd = 'find "' + loc + '" -type f -name "sequence_*.jpg"',
	find_cb = function (ste, std) {
		if (ste) {
			return errorHandle(ste);
		}
		var frames = std.split('\n'),
			execStr = 'montage ',
		montage_cb = function (stee, stdd) {
			if (stee) {
				return errorHandle(ste);
			}

			console.log('Created page_' + pageCount + '.jpg!');
			pageCount++;
			if (pageCount === page) {
				console.log('Cleaning up...');
				setTimeout(function () {
					exec('find "' + loc + '" -type f -name "sequence_*.jpg" -delete', function () {
						fs.rmdirSync(_tmp);
						console.log('Done!');
					});
				}, 1000);
			}
		};
		for (var i = 0; i < frames.length; i++) {
			execStr += frames[i] + ' ';
			if ((i + 1) % (width * length) === 0 || i === frames.length - 1) {
				execStr += '\ -tile 1x' + length + '  -geometry ' + dim.w + 'x' + dim.h + '+' + Math.round((dim.o - dim.w) / 2) + '+0 miff:- |\  \nmontage - -geometry +0+0 -tile ' + width + 'x1 -density ' + dim.dpi + ' "./page_' + page + '.jpg"';
				exec(execStr, montage_cb);
				execStr = 'montage ';
				page++;
			}
		}
	};

	loc = _tmp;

	console.log('Stitching frames into sheets...');
	console.log('Sheets will contain ' + width + 'x' + length + ' frames...');
	exec(cmd, find_cb);
};
var errorHandle = function (err) {
	'use strict';
	if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--verbose') !== -1){
		console.error(err);
	} else {
		console.error('Error running program. Run in verbose mode for more info (-v,--verbose)');
	}
	process.exit(1);
};

process.on('uncaughtException', function (err) {
	errorHandle(err);
});


if (typeof process.argv[2] === 'undefined') {
	console.error('No path to video defined');
	process.exit(1);
}

if (typeof process.argv[3] === 'undefined') {
	process.argv[3] = 300;
	console.log('Using default 300dpi');
}

convert(process.argv[2], process.argv[3]);

/*

	INSTALLATION AND RUNNING

*/

//Install in this order to satisfy requirements: GCC required by MacPorts, etc.

//Install Node         http://nodejs.org/dist/v0.10.22/node-v0.10.22.pkg
//Install GCC          https://github.com/kennethreitz/osx-gcc-installer#option-1-downloading-pre-built-binaries
//Install MacPorts     http://www.macports.org/install.php
//Install ImageMagick  in terminal type "sudo port install ImageMagick"
//Install avconv        -see below

/*
Download and unzip http://libav.org/releases/libav-9.6.tar.gz
in terminal type "cd " and drag in unzipped folder and hit enter
in terminal copy "sudo port install yasm zlib bzip2 faac lame speex libogg libvorbis libtheora libvpx x264 XviD openjpeg15 opencore-amr freetype" (without quotes) hit enter
in terminal copy "./configure \ --enable-gpl --enable-libx264 --enable-libxvid \ --enable-version3 --enable-libopencore-amrnb --enable-libopencore-amrwb \ --enable-nonfree --enable-libfaac \ --enable-libmp3lame --enable-libspeex --enable-libvorbis --enable-libtheora --enable-libvpx \ --enable-libopenjpeg --enable-libfreetype --enable-doc --enable-gnutls --enable-shared" hit enter
(if that gives errors just use "./configure" and hit enter)
in terminal copy "make && sudo make install" hit enter

	that will install it
*/

//run by going to terminal typing "node " dragging this script into the terminal, dragging the video into the terminal and adding a DPI value and hitting enter
//the command should look something like this:
//node /Users/stenzel/Desktop/video_to_page.js /Users/stenzel/Desktop/PaulRobeson/Paul\ Robeson\ discusses\ Othello.mp4 600


//Get the absolute path of any file by dragging it into terminal and copying the results
//Must be enclosed by ''
//Will generate pages and frames in same folder as source video
