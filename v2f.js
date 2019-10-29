'use strict';
const cmd = require('commander');
const async = require('async');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const os = require('os');
const osTmp = os.tmpdir();
const TMP = path.join(osTmp, '/v2f/');
const pkg = require('./package.json');
class Dimensions {
    constructor(filmStr, dpi) {
        const IN = dpi / 25.4;
        const film = this._gauge(filmStr);
        this.h = Math.round(film.h * IN); //frame height
        this.w = Math.round(film.w * IN); //frame width
        this.o = Math.round(film.o * IN); //space between columns
        this.dpi = dpi;
        this.film = film;
    }
    _gauge(film) {
        if (film === '16mm') {
            return {
                h: 7.62,
                w: 10.5,
                o: 16
            };
        }
        else if (film === 'super16') {
            return {
                h: 7.62,
                w: 12.75,
                o: 16
            };
        }
        else if (film === '35mm') {
            return {
                h: 19.05,
                w: 22,
                o: 35
            };
        }
        else {
            error('Film type not found, see --help for more info');
        }
    }
}
/**
 *
 *
 * @function
 * @param {Object} Commander object
 */
function initialize(command) {
    const dpi = command.dpi || 300;
    const film = command.film || '16mm';
    const input = command.input || command.args[0] || error('No input file, see --help for more info');
    const output = command.output || command.args[1] || error('No ouput directory, see --help for more info');
    const dim = new Dimensions(film, dpi);
    const pageW = command.width || 8.5;
    const pageL = command.length || 11;
    const exe = command.executable || 'avconv';
    const negative = typeof command.negative !== 'undefined' ? true : false;
    if (!fs.existsSync(input))
        error(`Video "${input}" cannot be found`);
    async.series([
        (next) => {
            convert(exe, input, dim, negative, next);
        },
        (next) => {
            stitch(output, dim, next, pageW, pageL);
        },
        cleanup
    ], () => {
        console.log(`Finished creating pages`);
    });
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
function convert(exe, input, dim, negative = false, next) {
    const file = input.split('/').pop();
    const negStr = negative ? `-vf lutrgb="r=negval:g=negval:b=negval"` : '';
    const execStr = `${exe} -i "${input}" -s ${dim.w}x${dim.h} -qscale 1 ${negStr} "${TMP}v2f_sequence_%04d.jpg"`;
    console.log(`Converting  ${file}...`);
    console.log(`Exporting all frames with aspect ratio:  ${dim.w / dim.h}...`);
    if (!fs.existsSync(TMP))
        fs.mkdirSync(TMP);
    exec(execStr, (ste, std) => {
        if (ste) {
            return error(ste);
        }
        console.log('Frames exported successfully!');
        next();
    });
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
function stitch(output, dim, next, pageW, pageL) {
    const length = Math.floor((pageL * dim.dpi) / dim.h) - 1;
    const width = Math.floor((pageW * dim.dpi / dim.o)) - 1;
    const loc = TMP.substring(0, TMP.length - 1);
    const diff = Math.round((dim.o - dim.w) / 2);
    let page = 0;
    let pageCount = 0;
    let cmd = `find "${loc}" -type f -name "v2f_sequence_*.jpg"`;
    console.log('Stitching frames into sheets...');
    console.log(`Sheets will contain ${width}x${length} frames...`);
    exec(cmd, (ste, std) => {
        if (ste) {
            return error(ste);
        }
        let jobs = [];
        let cmds = [];
        let frames = std.split('\n');
        let execStr = 'montage ';
        let pagePath = ``;
        let i = 0;
        frames = frames.filter((elem) => {
            if (elem.indexOf('find: ') === -1) {
                return elem;
            }
        });
        frames.sort();
        for (let frame of frames) {
            execStr += `${frame} `;
            if ((i + 1) % (width * length) === 0 || i === frames.length - 1) {
                pagePath = path.join(output, `./page_${pad(page)}.jpg`);
                execStr += `\ -tile 1x${length} -geometry ${dim.w}x${dim.h}+${diff}+0 miff:- |\  \nmontage - -geometry +0+0 -tile ${width}x1 -density ${dim.dpi} "${pagePath}"`;
                cmds.push(execStr);
                execStr = 'montage ';
                page++;
            }
            i++;
        }
        jobs = cmds.map((cmd) => {
            return (cb) => {
                exec(cmd, (err, std, ste) => {
                    if (err) {
                        return error(err);
                    }
                    console.log(`Created page of ${width}x${length} frames!`);
                    cb();
                });
            };
        });
        async.series(jobs, next);
    });
}
function cleanup(next) {
    console.log('Cleaning up...');
    exec(`rm -r "${TMP}"`, (err) => {
        if (err)
            console.error(err);
        if (next)
            next();
    });
}
function pad(n) {
    return ('00000' + n).slice(-5);
}
var error = function (err) {
    if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--verbose') !== -1) {
        console.error(err);
    }
    else {
        console.error('Error running program. Run in verbose mode for more info (-v,--verbose)');
    }
    process.exit(1);
};
process.on('uncaughtException', err => {
    error(err);
});
//convert(process.argv[2], process.argv[3])
//fix for nexe
let args = [].concat(process.argv);
if (args[1].indexOf('v2f.js') === -1) {
    args.reverse();
    args.push('node');
    args.reverse();
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
    .parse(args);
initialize(cmd);
