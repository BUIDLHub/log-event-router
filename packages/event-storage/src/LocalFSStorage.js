import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const homedir = require('os').homedir();
const baseDir = path.join(homedir, "log_event_streams");
const _read = (dbName) => {
  const f = path.join(baseDir, dbName);
  if(fs.existsSync(f)) {
    let data = fs.readFileSync(f, {encoding: "utf8"});
    return JSON.parse(data);
  }
  return {}
}

const _write = (dbName, data) => {
  if(!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, {recursive: true});
  }
  const f = path.join(baseDir, dbName);

  if(typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  fs.writeFileSync(f, data);
}

const execCallback = (prom, cb) => {
  if(typeof cb !== 'function') {
    return;
  }

  prom.then(r=>cb(null, r))
      .catch(e=>cb(e));
}

const asProm = fn => {
  return new Promise((done,err)=>{
    try {
      let r = fn()
      done(r);
    } catch (e) {
      err(e);
    }
  });
}

export default class LocalFSDriver {
  constructor() {
    this._driver = 'localFSDriver';
    this.data = {};
    [
      '_initStorage',
      'clear',
      'getItem',
      'iterate',
      'key',
      'keys',
      'length',
      'removeItem',
      'setItem'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  _initStorage(options) {
    return asProm(()=>{
      this.dbName = options.name;
      this.data = _read(options.name);
    })
  }

  clear(callback) {
    let p = asProm(()=>{
      this.data = {};
      _write(this.dbName, this.data);
    });
    execCallback(p, callback);
    return p;
  }

  getItem(key, callback) {
      let p = asProm(()=>{
        return this.data[key];
      });
      execCallback(p, callback);
      return p;
  }
  iterate(iterator, successCallback) {
      let p = asProm(()=>{
        let keys = _.keys(this.data);
        keys.sort();
        keys.forEach((k,i)=>{
          let v = this.data[k];
          iterator(v, k, i);
        });
      });
      execCallback(p, successCallback);
      return p;
  }

  key(n, callback) {
      let p = asProm(()=>{
        let keys = _.keys(this.data);
        keys.sort();
        let k = keys[n];
        return this.data[k];
      });
      execCallback(p, callback);
      return p;
  }

  keys(callback) {
      let p = asProm(()=>{
        let keys = _.keys(this.data);
        keys.sort();
        return keys;
      });
      execCallback(p, callback);
      return p;
  }

  length(callback) {
      let p = asProm(()=>{
        let keys = _.keys(this.data);
        return keys.length;
      });
      execCallback(p, callback);
      return p;
  }

  removeItem(key, callback) {
      let p = asProm(()=>{
        if(this.data[key]) {
          delete this.data[key];
          _write(this.dbName, this.data);
        }
      });
      execCallback(p, callback);
      return p;
  }

  setItem(key, value, callback) {
      let p = asProm(()=>{
        this.data[key] = value;
        _write(this.dbName, this.data);
      });
      execCallback(p, callback);
      return p;
  }
}
