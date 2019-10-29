'use strict'

const { exec } = require('pkg')
const execRaw = require('child_process').exec
const os = require('os')
const fs = require('fs-extra')
const packageJson = require('./package.json')

const platform = os.platform()
const arch = os.arch()

/**
 * 	Shells out to execute a command with async/await.
 * 	Async wrapper to exec module.
 *
 *	@param	{string} 	cmd 	Command to execute
 *
 *	@returns {Promise} 	Promise containing the complete stdio
 **/
async function shell_out (cmd) {
	return new Promise((resolve, reject) => {
		return execRaw(cmd, (err, stdio, stderr) => {
			if (err) return reject(err)
			return resolve(stdio)
		})
	})
}

//exec(args) takes an array of command line arguments and returns a promise. For example:

if (!fs.existsSync(`./dist/${platform}_${arch}`)) {
	fs.mkdirSync(`./dist/${platform}_${arch}`)
}

console.log(`Building v2f and saving in dist/${platform}_${arch}...`)
console.time('v2f')
exec([ 'v2f.js', '--target', 'node10', '--output', `./dist/${platform}_${arch}/v2f` ]).then(async (res) => {
	try {
		await shell_out(`zip -r ./dist/v2f_${platform}_${arch}_${packageJson.version}.zip ./dist/${platform}_${arch}/v2f`)
		console.log(`Compressed binary to dist/v2f_${platform}_${arch}_${packageJson.version}.zip`)
	} catch (err) {
		console.error(err)
		process.exit(err)
	}

	console.timeEnd('v2f')
	console.log('built')
}).catch(err => {
	console.error(err)
})
// do something with app.exe, run, test, upload, deploy, etc