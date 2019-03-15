#!/usr/bin/env node
import * as Yargs from 'yargs';
import fs from 'fs';
import { PartialZip } from '../index';

const urlRegex = /https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\/?.*/;

async function download(argv: any) {
  if (!urlRegex.test(argv.url)) throw new Error('Invalid URL');
  const pz = new PartialZip({ url: argv.url });
  await pz.init();
  const file = pz.files.get(argv.filename);

  if (file === undefined) throw new Error('File Not Found');

  const output = argv.output ? argv.output : file.fileName.split('/').slice(-1)[0];
  const data = await pz.get(file);
  fs.writeFile(`./${output}`, data, (err) => {
    console.log(`Done writing ${output}`);
  });
}

async function list(argv: any) {
  if (!urlRegex.test(argv.url)) throw new Error('Invalid URL');
  const pz = new PartialZip({ url: argv.url });
  await pz.init();
  for (const [fileName, fileInfo] of pz.files) {
    if (fileName.endsWith('/')) continue;
    console.log('%s\t%s', bytesToSize(fileInfo.uncompressedSize), fileName);
  }
}

const args = require('yargs')
  .scriptName('partialzip')
  .usage('$0 <cmd> [args]')
  .showHelpOnFail(true)
  .command({
    command: 'list <url>',
    aliases: ['ls'],
    desc: 'List files in a Zip URL',
    builder: (args: Yargs.Argv) => {
      args.positional('url', {
        type: 'string',
        describe: 'Zip URL',
      });
    },
    handler: list,
  })
  .command({
    command: 'download <url> <filename> [output]',
    desc: 'Download file from Zip URL',
    builder: (args: Yargs.Argv) => {
      args.positional('url', {
        type: 'string',
        describe: 'Zip URL',
      });
      args.positional('filename', {
        type: 'string',
        describe: 'Filename of file inside Zip',
      });
      args.positional('output', {
        type: 'string',
        describe: 'Output Location',
      });
    },
    handler: download,
  })
  .help('help', 'Show help info.')
  .demandCommand()
  .recommendCommands()
  .strict()
  .fail((msg: any, err: Error) => {
    if (err) return console.log(err.message);
    Yargs.showHelp();
  })
  .argv;

// Modified from https://stackoverflow.com/a/18650828/11131612
function bytesToSize(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1000));
  return `${Math.round(bytes / Math.pow(1000, i))} ${sizes[i]}`;
}
