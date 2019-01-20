const path = require('path');
const fs = require('fs');
const vm = require('vm');

function Module (id) {
  this.id = id;
  this.exports = {};
  this.loaded = false;
  this.filename = null;
}

Module._cache = Object.create(null);
Module._extensions = Object.create(null);

Module.wrap = function(script) {
  return Module.wrapper[0] + script + Module.wrapper[1];
};

Module.wrapper = [
  '(function (exports, require, module, __filename, __dirname) { ',
  '\n});'
];

Module._load = function(request) {
  var filename = Module._resolveFilename(request);
  var cachedModule = Module._cache[filename];
  if (cachedModule) {
    return cachedModule.exports;
  }
  var module = new Module(filename);
  Module._cache[filename] = module;
  tryModuleLoad(module, filename);
  return module.exports;
};

Module._resolveFilename = function(request) {
  var filename = Module._findPath(request);
  if (!filename) {
    var err = new Error(`Cannot find module '${request}'`);
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }
  return filename;
};

Module._findPath = function(request) {
  var filename = path.resolve(request);
  return filename;
};

function tryModuleLoad(module, filename) {
  var threw = true;
  try {
    module.load(filename);
    threw = false;
  } finally {
    if (threw) {
      delete Module._cache[filename];
    }
  }
}

Module.prototype.load = function(filename) {
  this.filename = filename;
  var extension = path.extname(filename) || '.js';
  if (!Module._extensions[extension]) extension = '.js';
  Module._extensions[extension](this, filename);
  this.loaded = true;
};

Module._extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(content, filename);
};

Module._extensions['.json'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  try {
    module.exports = JSON.parse(content);
  } catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
};

Module.prototype._compile = function(content, filename) {
  var wrapper = Module.wrap(content);
  var compiledWrapper = vm.runInThisContext(wrapper);
  var dirname = path.dirname(filename);
  var result;
  result = compiledWrapper.call(this.exports, this.exports, require, this, filename, dirname);
  return result;
};

function require2 (path) {
  return Module._load(path);
}

let str = require2('./b.json')
console.log(str)