"use strict";

const path = require('path');
const exec = require('child_process').exec;

const fs = require('fs-extra');

module.exports = {
  solutionOnly(opts, runCode, fail) {
    const executable = path.join(opts.dir, 'solution');
    const solutionFile = path.join(opts.dir, 'solution.c');
    fs.outputFileSync(solutionFile, opts.solution);
    const args = [
      'clang',
      '-std=c11',
      solutionFile,
      '-o', executable,
      '-lm'
    ];
    if (opts.setup) {
      const setupFile = path.join(opts.dir, 'setup.c');
      fs.outputFileSync(setupFile, opts.setup);
      args.push(setupFile);
    }
    exec(args.join(' '), function(error, stdout, stderr) {
      if (error) return fail(error, stdout, stderr);
      opts.publish('stdout', stdout);
      runCode({'name': executable, 'args': []});
    });
  },
  testIntegration(opts, runCode, fail) {
    const executable = path.join(opts.dir, 'solution');
    const solutionFile = path.join(opts.dir, 'solution.c');
    const fixtureFile = path.join(opts.dir, 'fixture.c');
    fs.outputFileSync(solutionFile, opts.solution);
    fs.outputFileSync(fixtureFile, opts.fixture);
    const args = [
      'clang',
      '-std=c11',
      '-Wextra -Wall',
      fixtureFile,
      solutionFile,
      '-o', executable,
      './frameworks/c/criterion.c',
      '-I./frameworks/c',
      '-lcriterion',
      '-lm'
    ];
    if (opts.setup) {
      const setupFile = path.join(opts.dir, 'setup.c');
      fs.outputFileSync(setupFile, opts.setup);
      args.push(setupFile);
    }
    exec(args.join(' '), function(error, stdout, stderr) {
      if (error) return fail(error, stdout, stderr);
      if (stderr)
        console.error(stderr);
      opts.publish('stdout', stdout);
      opts.publish('stderr', stderr);
      runCode({'name': executable, 'args': ['-j1', '--full-stats']});
    });
  },
  sanitizeStdErr(opts, error) {
    return error
      .replace(/clang.*-std=c[^\s]+/g, '')
      .replace(/Error: Command failed:/g, '')
      .replace(/\/tmp.*(solution\.c|solution)[:0-9]*/g, '')
      .replace('\n', '')
      .replace('  ', ' ')
      .replace(opts.setup || '', '')
      .replace(opts.fixture || '', '');
  }
};
