import * as core from '@actions/core';
import * as toolCache from '@actions/tool-cache';
import * as io from '@actions/io';
import * as path from 'path';
import * as fs from 'fs';

interface Options {
	version: string,
	path: string
}

async function getUbuntuVersion(llvmVersion: string): Promise<string | null> {
	const url = `https://api.github.com/repos/llvm/llvm-project/releases/tags/llvmorg-${llvmVersion}`;
	console.log(`Release url is ${url}`);
	const archive = await toolCache.downloadTool(url);
	const txt = await fs.promises.readFile(archive);
	const json = JSON.parse(txt.toString());

	for (const asset of json.assets) {
		const match = asset.name.match(/-x86_64-linux-gnu-ubuntu-(\d+\.\d+)\./);
		if (match && match[1]) return match[1];
	}

	return null;
}

function getDefaultPath(llvmVersion: string) {
	return path.join(process.cwd(), '.install-llvm-action', llvmVersion);
}

async function installLinux(options: Options): Promise<void> {
	console.log('Installing Linux version');

	io.mkdirP(options.path);

	const ubuntuVersion = await getUbuntuVersion(options.version);
	const url = `https://github.com/llvm/llvm-project/releases/download/llvmorg-${options.version}/clang+llvm-${options.version}-x86_64-linux-gnu-ubuntu-${ubuntuVersion}.tar.xz`;
	console.log(`Download url is ${url}`);
	const archive = await toolCache.downloadTool(url);
	const dist = await toolCache.extractTar(archive, options.path, ['x', '--strip-components=1']);
	core.addPath(path.join(dist, 'bin'));
	console.log(`Installed to ${dist}`);
}

async function installWindows(options: Options): Promise<void> {
	console.log('Installing Windows version');
	core.setFailed('Windows install not yet supported');
}
 
function install(options: Options): Promise<void> {
	if (process.platform == 'win32') {
		return installWindows(options);
	} else {
		return installLinux(options);
	}
}

async function run(): Promise<void> {
	const version = core.getInput('version', { required: true });
	const path = core.getInput('path') || getDefaultPath(version);
	
	console.log(`Requested version ${version} to path ${path}`);

	await install({ version, path });
}

run();