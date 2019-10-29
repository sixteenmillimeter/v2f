'use strict'

const cmd = require('commander')
const async = require('async')
const exec = require('child_process').exec
const fs = require('fs')
const path = require('path')
const os = require('os')

const osTmp : string = os.tmpdir()
const TMP : string = path.join(osTmp, '/v2f/')
const pkg : any = require('./package.json')

class Dimensions{
	h : number;
	w : number;
	o : number;
	dpi : number;
	film : any;

	constructor (filmStr : string, dpi : number) {
		const IN : number = dpi / 25.4
		const film : any = this._gauge(filmStr)

		this.h = Math.round(film.h * IN) //frame height
		this.w = Math.round(film.w * IN) //frame width
		this.o = Math.round(film.o * IN) //space between columns
		this.dpi = dpi
		this.film = film
	}

	_gauge (film : string) {
		if (film === '16mm') {
			return {
				h: 7.62,
				w : 10.5,
				o : 16
			}
		} else if (film === 'super16'){
			return {
				h: 7.62,
				w : 12.75,
				o : 16
			}
		} else if (film === '35mm') {
			return {
				h : 19.05,
				w : 22,
				o : 35
			}
		} else {
			error('Film type not found, see --help for more info')
		}
	}
}

/**
 * 
 *
 * @function
 * @param {Object} Commander object
 */
function initialize (command : any) {
	const dpi : number = command.dpi || 300
	const film : string = command.film || '16mm'
	const input : string = command.input || command.args[0] || error('No input file, see --help for more info')
	const output : string = command.output || command.args[1] || error('No ouput directory, see --help for more info')
	const dim : any = new Dimensions(film, dpi)
	const pageW : number = command.width || 8.5
	const pageL : number = command.length || 11
	const exe : string = command.executable || 'avconv'
	const negative : boolean = typeof command.negative !== 'undefined' ? true : false

	if (!fs.existsSync(input)) error(`Video "${input}" cannot be found`)

	async.series([
		(next : any)=> {
			convert(exe, input, dim, negative, next)
		},
		(next : any) => {
			stitch(output, dim, next, pageW, pageL)
		},
		cleanup
	], () => {
		console.log(`Finished creating pages`)
	})
}

/** *
 * Create image sequence from source video, using
 * 
 * @function
 * @param {String} 		input  	file path (absolute)
 * @param {Integer} 	dpi 	target printing dpi
 * @param {Integer} 	length 	strip length in frames
 * 
*/
function convert (exe : string, input : string, dim : any, negative : boolean = false, next : any) {
	const file : string = input.split('/').pop()
	const negStr : string = negative ? `-vf lutrgb="r=negval:g=negval:b=negval"` : '';
	const execStr : string = `${exe} -i "${input}" -s ${dim.w}x${dim.h} -qscale 1 ${negStr} "${TMP}v2f_sequence_%04d.jpg"`

	console.log(`Converting  ${file}...`)
	console.log(`Exporting all frames with aspect ratio:  ${dim.w / dim.h}...`)

	if (!fs.existsSync(TMP)) fs.mkdirSync(TMP)

	exec(execStr, (ste : any, std : string) => {
		if (ste) {
			return error(ste)
		}
		console.log('Frames exported successfully!')
		next()
	})
}

/** *
 * Stitch rendered frames into strips

 * @function
 * @param {String}	 	output   	Path of folder containing frames
 * @param {Object}	  	dim   		Dimensions object
 * @param {Function}	next		Async lib callback function
 * @param {Integer}		pageW 		Page width in inches
 * @param {Integer}		pageL 		Page length in inches
 * 
*/
function stitch (output : string, dim : any, next : any, pageW : number, pageL : number) {
	const length : number = Math.floor((pageL * dim.dpi) / dim.h) - 1
	const width : number = Math.floor((pageW * dim.dpi / dim.o)) - 1
	const loc : string = TMP.substring(0, TMP.length - 1)
	const diff : number = Math.round((dim.o - dim.w) / 2)
	let page : number = 0
	let pageCount : number = 0
	let cmd : string = `find "${loc}" -type f -name "v2f_sequence_*.jpg"`

	console.log('Stitching frames into sheets...')
	console.log(`Sheets will contain ${width}x${length} frames...`)

	exec(cmd, (ste : any, std : string) => {
		if (ste) {
			return error(ste)
		}
		let jobs : any[] = []
		let cmds : string[]  = []
		let frames : string[] = std.split('\n')
		let execStr : string = 'montage '
		let pagePath : string = ``
		let i : number = 0

		frames = frames.filter((elem : string) => {
			if (elem.indexOf('find: ') === -1) {
				return elem
			}
		})
		frames.sort()
		for (let frame of frames) {
			execStr += `${frame} `
			if ((i + 1) % (width * length) === 0 || i === frames.length - 1) {
				pagePath = path.join(output, `./page_${pad(page)}.jpg`)
				execStr += `\ -tile 1x${length} -geometry ${dim.w}x${dim.h}+${diff}+0 miff:- |\  \nmontage - -geometry +0+0 -tile ${width}x1 -density ${dim.dpi} "${pagePath}"`
				cmds.push(execStr)
				execStr = 'montage '
				page++
			}
			i++
		}
		jobs = cmds.map((cmd : string) => {
			return (cb : any) => {
				exec(cmd, (err : any, std : string, ste : string) => {
					if (err) {
						return error(err)
					}
					console.log(`Created page of ${width}x${length} frames!`)
					cb()
				})
			}
		})
		async.series(jobs, next)
	})
}

function cleanup (next : any) {
	console.log('Cleaning up...');
	exec(`rm -r "${TMP}"`,  (err : any) => {
		if (err) console.error(err)
		if (next) next()
	})
}

function pad (n : number) {
	return ('00000' + n).slice(-5)
}

var error = function (err : any) {
	if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--verbose') !== -1){
		console.error(err)
	} else {
		console.error('Error running program. Run in verbose mode for more info (-v,--verbose)')
	}
	process.exit(1)
}

process.on('uncaughtException', err => {
	error(err)
})

//convert(process.argv[2], process.argv[3])

//fix for nexe
let args = [].concat(process.argv)
if (args[1].indexOf('v2f.js') === -1) {
	args.reverse()
	args.push('node')
	args.reverse()
}

cmd.arguments('<input> <output>')
	.version(pkg.version)
	.option('-i, --input <path>', 'Video source to print to film strip, anything that avconv can read')
	.option('-o, --output <path>', 'Output directory, will render images on specified page size')
	.option('-d, --dpi <dpi>', 'DPI output pages')
	.option('-f, --film <gauge>', 'Choose film gauge: 16mm, super16, 35mm')
	.option('-w, --width <inches>', 'Output page width, in inches. Default 8.5')
	.option('-l, --length <inches>', 'Output page length, in inches. Default 11')
	.option('-e, --executable <binary>', 'Alternate binary to use in place of avconv, ie ffmpeg')
	.option('-v, --verbose', 'Run in verbose mode')
	.option('-n, --negative', 'Invert color channels to create negative')
	.parse(args)

initialize(cmd)