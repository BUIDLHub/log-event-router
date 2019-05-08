import localforage from 'localforage';
import {extendPrototype} from 'localforage-setitems';
import BaseDB, {
  storeSchema,
  storeBulkSchema,
  readSchema,
  readAllSchema,
  findSchema,
  updateSchema,
  removeSchema,
  iterateSchema
} from './BaseDB';
import _ from 'lodash';
import LocalFS from "./LocalFSStorage";

extendPrototype(localforage);

const canStoreInLN = () => {
  try {

    localStorage.setItem("__test", "true");

    let i = localStorage.getItem("__test");
    console.log("LS test", i);
    if(!i) {
      return false;
    }
    localStorage.removeItem("__test");
    return true;
  } catch (e) {
    console.log("Problem storing LS", e);
    return false;
  }
}

const localStorageValid = () => {
  console.log("Testing local storage");
  return (typeof localStorage !== 'undefined') &&
            'setItem' in localStorage &&
            canStoreInLS()
}

const dbFactory = async props => {
  var db = await localforage.createInstance({
    name: props.name,
    driver: "localFSDriver"
  });
  return db;
}

const _buildSortFn = props => {
  if(!props.sort) {
    props.sort = [
      {
        field: "blockNumber",
        order: "desc"
      }
    ];
  }

  let sorter = (set, fld, isAsc) => {
    set.sort((a,b)=>{
      let av = a[fld];
      let bv = b[fld];
      if(av > bv) {
        return isAsc ? 1 : -1;
      }
      if(av < bv) {
        return isAsc ? -1 : 1;
      }
      return 0;
    });
  };
  return set => {
    props.sort.forEach(s=>{
      sorter(set, s.field, s.order.toUpperCase() === 'ASC')
    });
  }
}

let inst = null;
export default class LocalForage extends BaseDB {
  static get instance() {

    if(!inst) {
      if(!localStorageValid()) {
        console.log("Installing local FS driver...");
        let local = new LocalFS();
        localforage.defineDriver(local);
      }
      inst = new LocalForage();
    }
    return inst;
  }

  constructor(props) {
    super(props);
    this.querySizeLimit = props?props.querySizeLimit || 50:50;

    [
      'store',
      'storeBulk',
      'read',
      'readAll',
      'find',
      'update',
      'remove',
      'removeDB',
      'iterate'
    ].forEach(fn=>{
      this[fn]=this[fn].bind(this)
    });
  }

  async removeDB(name) {
    let db = this.dbs[name];
    if(!db) {
      return;
    }
    console.log("Dropping DB", name);
    db.dropInstance();
    this.dbs[name] = undefined;
  }

  async store(props) {
    storeSchema.validateSync(props);
    let db = await this._getDB(props, dbFactory);
    try {
      await db.setItem(props.key, props.data);
    } catch (e) {
      console.log("Problem storing to", props.database, e);
    }

  }

  async storeBulk(props) {
    storeBulkSchema.validateSync(props);
    let db = await this._getDB(props, dbFactory);
    try {
      await db.setItems(props.items);
    } catch (e) {
      console.log("Problem storing items", props.database, e);
    }
  }

  async read(props) {
    readSchema.validateSync(props);
    let db = await this._getDB(props, dbFactory);
    let r = await db.getItem(props.key);
    return r ? [r] : [];
  }

  async readAll(props) {
    readAllSchema.validateSync(props);
    let db = await this._getDB(props, dbFactory);

    let set = [];
    let sortFn = _buildSortFn(props);
    let limit = props.limit || this.querySizeLimit;
    let filterFn = props.filterFn;
    await db.iterate((v, k, itNum)=>{
      if(itNum > limit) {
        return set;
      }
      if(filterFn) {
        if(filterFn(v, k, itNum)) {
          set.push(v);
        }
      } else {
        set.push(v);
      }
    });
    if(sortFn) {
      sortFn(set);
    }
    return set;
  }

  async iterate(props) {
    iterateSchema.validateSync(props);
    if(typeof props.callback !== 'function') {
      throw new Error("Missing callback function");
    }
    let db = await this._getDB(props, dbFactory);
    await db.iterate(props.callback);
  }

  async find(props) {
    findSchema.validateSync(props);
    let db = await this._getDB(props, dbFactory);
    let set = [];
    let sortFn = _buildSortFn(props);
    let limit = props.limit || this.querySizeLimit;
    let selKeys = _.keys(props.selector);
    let offset = props.offset || 0;
    let includeTotal = props.includeTotal;
    let skipping = offset > 0;
    let endLength = offset + limit;

    let total = 0;
    await db.iterate((dbVal, dbKey, itNum)=>{
      let allMatch = true;
      //filter based on selectors first. This way we make
      //sure paging and sorting work with the same dataset
      //each time. This is terribly slow but localforage/indexedDB
      //doesn't offer skipping records. An optimization might be
      //to keep our own index of record counts so that at a minimum
      //we're not running through entire set each time. Skipping would
      //still require walk from beginning. I don't know what happens if
      //records are inserted during paging operation...would we miss an
      //item if it's key were iterated earlier than the page we skipped?
      //This needs more thought.
      for(let i=0;i<selKeys.length;++i) {
        let p = selKeys[i];
        let tgt = props.selector[p];
        let v = dbVal[p];
        if(!isNaN(v) && !isNaN(tgt)) {
          v -= 0;
          tgt -= 0;
        }
        if(v !== tgt) {
          allMatch = false;
          break;
        }
      }
      if(allMatch) {
        ++total;
        if(!skipping && set.length < endLength) {
          set.push(dbVal);
        } else if(!skipping && set.length >= endLength && !includeTotal) {
          return set;
        }
      }

      skipping = total < offset || set.length > (offset+limit);
    });

    if(sortFn) {
      sortFn(set);
    }
    if(includeTotal) {
      return {
        total,
        data: set
      }
    }
    return set;
  }

  async update(props) {
    updateSchema.validateSync(props);
  }

  async remove(props) {
    removeSchema.validateSync(props);
  }
}
