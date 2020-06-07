#!/usr/bin/env node
import { existsSync, statSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';
import { parse } from 'url';
import * as yargs from 'yargs';
import FileZip from '../lib/FileZip';
import PartialZip from '../lib/PartialZip';

// Modified from https://stackoverflow.com/a/18650828/11131612
function bytesToSize(bytes: number | BigInt): string {
  const input = BigInt(bytes);
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  // tslint:disable-next-line:triple-equals
  if (input === 0n) return '0 B';
  // TODO: Add math floor and logarithm
  // Math.floor seems to be done by default in BigInt divsion
  // So I only need to logarithm
  const i = Math.floor(Math.log(Number(bytes)) / Math.log(1000));
  return `${input / BigInt(1000 ** i)} ${sizes[i]}`;
}

const isUrl = (pathOrUrl: string) => ['http:', 'https:'].includes(parse(pathOrUrl).protocol || '');


async function list(argv: any) {
  const Zip = isUrl(argv.url) ? PartialZip : FileZip;

  const pz = new Zip(argv.url);
  await pz.init();

  pz.files.forEach((fileInfo, fileName) => {
    if (fileName.endsWith('/')) return;
    const { extraField, uncompressedSize } = fileInfo;

    const size = extraField.zip64 && extraField.zip64.uncompressedSize
      ? extraField.zip64.uncompressedSize
      : BigInt(uncompressedSize);

    // eslint-disable-next-line no-console
    console.log(
      '%s\t%s',
      bytesToSize(size),
      fileName,
    );
  });
}

async function download(argv: any) {
  const Zip = isUrl(argv.url) ? PartialZip : FileZip;

  const pz = new Zip(argv.url);
  await pz.init();

  const fileInfo = pz.files.get(argv.filename);
  if (!fileInfo) throw new Error('File Not Found');

  let output = resolve(argv.output ? argv.output : basename(fileInfo.fileName));

  if (existsSync(output)) {
    const outputStat = statSync(output);
    if (outputStat.isDirectory()) {
      output = join(argv.output, basename(fileInfo.fileName));
    }

    if (outputStat.isFile()) throw new Error('File Exists');
  }

  const data = await pz.get(fileInfo);

  writeFileSync(output, data);
}


// eslint-disable-next-line @typescript-eslint/no-unused-expressions
yargs
  .scriptName('partialzip')
  .usage('$0 <cmd> [args]')
  .showHelpOnFail(true)
  .command({
    command: 'list <url>',
    aliases: ['ls'],
    describe: 'List files in a Zip URL',
    builder(args: yargs.Argv) {
      return args.positional('url', {
        type: 'string',
        describe: 'Zip URL',
      });
    },
    handler: list,
  })
  .command({
    command: 'download <url> <filename> [output]',
    aliases: ['dl'],
    describe: 'Download file from Zip URL',
    builder(args: yargs.Argv) {
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

      return args;
    },
    handler: download,
  })
  .help('help', 'Show help info.')
  .demandCommand()
  .recommendCommands()
  .strict()
  .fail((_msg: any, err: Error) => {
    if (err) return console.log(err.message); // eslint-disable-line no-console
    return yargs.showHelp();
  })
  .argv;
