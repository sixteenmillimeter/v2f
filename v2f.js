/*jshint strict: true, esversion:6, node: true, asi: true*/

'use strict'
const exec = require('child_process').exec
const fs = require('fs')
const _tmp = './temp'

//var frame_height = 7.61
//var frame_height = 7.49
let frame_height = 7.62
let frame_padding = 0

class Dimensions{
	constructor (film, dpi) {
		const IN = dpi / 25.4
		this.h = Math.round(film.frame_height * IN)
		this.w = Math.round(film.a * IN)
		this.o = Math.round(film.b * IN)
		this.dpi = dpi
		this.film = film
	}
}

/** *
 * Turn video into sheet of images

 * @function
 * @param {String} 	path  file path (absolute)
 * @param {Integer} dpi target printing dpi
 * @param {Integer} length strip length in frames
 * 
*/
function convert (path, dpi) {
	const film = { frame_height: frame_height, a : 10.5, b : 16}
	const dim = new Dimensions(film, dpi)
	const file = path.split('/').pop()
	const loc = _tmp + '/'
	const execStr = `avconv -i "${path}" -s ${dim.w}x${dim.h} -qscale 1 "${loc}sequence_%04d.jpg"`

	console.log(`Converting  ${file}...`)
	console.log(`Exporting all frames with aspect ratio:  ${dim.w / dim.h} ...`)

	if (!fs.existsSync(_tmp)) fs.mkdirSync(_tmp)

	exec(execStr, (ste, std) => {
		if (ste) {
			return errorHandle(ste)
		}
		console.log('Frames exported successfully!')
		stitch(loc.substring(0, loc.length - 1), dim)
	})
}

/** *
 * Stitch rendered frames into strips

 * @function
 * @param {String} 	loc   Path of folder containing frames
 * @param {Object}  dim   Dimensions object
 * 
*/

function stitch (loc, dim) {
	const length = Math.floor((11 * dim.dpi) / dim.h) - 1
	const width = Math.floor((8.5 * dim.dpi / dim.o)) - 1
	let page = 0
	let pageCount = 0
	let cmd = `find "${loc}" -type f -name "sequence_*.jpg"`
	function find_cb (ste, std) {
		if (ste) {
			return errorHandle(ste)
		}
		const frames = std.split('\n')
		let execStr = 'montage '
		function montage_cb (stee, stdd) {
			if (stee) {
				return errorHandle(ste)
			}

			console.log(`Created page_${pageCount}.jpg!`)
			pageCount++
			if (pageCount === page) {
				console.log('Cleaning up...');
				setTimeout(() => {
					exec(`find "${loc}" -type f -name "sequence_*.jpg" -delete`,  () => {
						fs.rmdirSync(_tmp)
						console.log('Done!')
					})
				}, 1000)
			}
		};
		for (let i = 0; i < frames.length; i++) {
			execStr += frames[i] + ' '
			if ((i + 1) % (width * length) === 0 || i === frames.length - 1) {
				execStr += '\ -tile 1x' + length + '  -geometry ' + dim.w + 'x' + dim.h + '+' + Math.round((dim.o - dim.w) / 2) + '+0 miff:- |\  \nmontage - -geometry +0+0 -tile ' + width + 'x1 -density ' + dim.dpi + ' "./page_' + page + '.jpg"'
				exec(execStr, montage_cb)
				execStr = 'montage '
				page++
			}
		}
	}

	loc = _tmp

	console.log('Stitching frames into sheets...')
	console.log(`Sheets will contain ${width}x${length} frames...`)
	exec(cmd, find_cb)
};

var errorHandle = function (err) {
	if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--verbose') !== -1){
		console.error(err)
	} else {
		console.error('Error running program. Run in verbose mode for more info (-v,--verbose)')
	}
	process.exit(1)
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
