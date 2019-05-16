const Web3 = require('web3');
const KittyAppStateStore = require('./shared');
const IPFS = require('ipfs');

const {
  EventStream
} = require('eth-event-stream');

const ipfs = new IPFS();

const NETWORK = 'mainnet';

// FIXME:
const RPC_ENDPOINT = "wss://mainnet.infura.io/ws";

let state = null;
let session = null;
let cache = {};

const kittyAppStateStore = new KittyAppStateStore();

// Credit David Walsh (https://davidwalsh.name/javascript-debounce-function)

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
  var timeout;

  return function executedFunction() {
    var context = this;
    var args = arguments;

    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
};

function getBoxes() {
  if (!cache.boxes) {
    cache.boxes = [...document.querySelectorAll(".box")];
  }

  return cache.boxes;
}

function getBox(index) {
  const box = getBoxes()[index];
  return box;
}

function getProgressArea() {
  if (!cache.progressArea) {
    cache.progressArea = document.querySelector(".progress-area");
  }
  return cache.progressArea;
}

function getCurrentStateArea() {
  if (! cache.currentStateArea) {
    cache.currentStateArea = document.querySelector('.current-state');
  }
  return cache.currentStateArea;
}

function updateKitties() {
  for (var i = 0; i < state.boxState.length; i++) {
    const boxState = state.boxState[i];
    if (! boxState) {
      continue;
    }

    const box = getBox(i);
    if (boxState.hash == box.dataset.hash) {
      continue;
    }

    if (boxState.kittyId) {
      const baseUrl = 'https://storage.googleapis.com/ck-kitty-image/0x06012c8cf97bead5deae237070f9587f8e7a266d';
      const url = baseUrl + '/' + boxState.kittyId + '.png';
      box.dataset.hash = boxState.hash;;
      box.innerHTML = `
        <img class='${boxState.imageClass}' src='${url}' />
        <p>${boxState.kittyId}</p>
        `;
    }
  }
}
const updateKittiesDebounced = debounce(updateKitties, 1000);

function updateBoxColors() {
  const { currentBlockIndex } = state;
  for (var i = 0; i < state.boxState.length; i++) {
    const boxState = state.boxState[i];
    const box = getBox(i);
    const outline = currentBlockIndex == i ? '3px solid tomato' : 'none';
    box.style.outline = outline;
    box.style.background = boxState.color;
  };
}
const updateBoxColorsDebounced = debounce(updateBoxColors, 50);

function updateCurrentStateArea() {
  const currentStateArea = getCurrentStateArea();
  currentStateArea.innerText = JSON.stringify(state, null, 2);
}
const updateCurrentStateAreaDebounced = debounce(updateCurrentStateArea, 100);

function updateProgress() {
  const progressArea = getProgressArea();

  const progressElem = progressArea.querySelector('progress');
  if (! progressElem) {
    console.log('could not find progress elemenent...');
  }
  const startingBlocksBehind = session.latestBlock - session.startingBlock;
  const blocksProcessed = session.currentBlock - session.startingBlock;
  const value = Math.ceil(100 * (blocksProcessed / startingBlocksBehind));
  progressElem.max = 100;
  progressElem.value = value;

  const summaryElem = progressArea.querySelector('.summary');
  const blocksBehind = session.latestBlock - session.currentBlock;
  let summary = "";

  if (session.syncDelay) {
    progressElem.style.display = "none";
    summary = Math.floor(session.syncDelay / 1000) + " seconds to fetch " + startingBlocksBehind + " blocks...";
    summary += "; currentBlock: " + session.currentBlock;
  } else if (blocksBehind > 0) {
    summary = blocksBehind + ' blocks behind...';
  }

  summaryElem.innerText = summary;
}

const updateProgressDebounced = debounce(updateProgress, 50);


function updateView() {
  //console.log('updating view...');
  updateBoxColorsDebounced();
  updateProgressDebounced();
  updateCurrentStateAreaDebounced();
  updateKittiesDebounced();
}


const paintBlocks = async (ctx) => {
  const bundle = ctx.bundle;

  const {
    blockNumber
  } = bundle;

  session.currentBlock = blockNumber;

  // stupd hack until I finish cleaning up the code...
  state = kittyAppStateStore.getState();

  updateView();
};

const web3Factory = () => {
  return new Web3(RPC_ENDPOINT);
}

const main = async (rootElement, initialState, ipfsHash) => {

  if (initialState) {
    kittyAppStateStore.loadState(initialState);
  } else if (ipfsHash) {
    console.log('fetching ' + ipfsHash);
    const ipfsData = await ipfs.cat(ipfsHash);
    console.log('data', ipfsData);
    const ipfsText = new TextDecoder().decode(ipfsData);
    console.log('decoded', ipfsText);
    return;
  }

  const abi = await kittyAppStateStore.getABI();
  const address = kittyAppStateStore.getConfig('contractAddress');
  const lag = kittyAppStateStore.getConfig('lag');

  const web3 = web3Factory();

  const stream = new EventStream({
    abi,
    address,
    web3Factory
  });

  stream.use(kittyAppStateStore.handleEvent);
  stream.use(paintBlocks);

  /*
  // TODO: looks like upon resume, we might have hit a infura node that was a little behind???

  Uncaught (in promise) Error: Start block must come before end block: 7763779 > 7763775
    at e.<anonymous> (client.js:35)
    at c (client.js:17)
    at Generator._invoke (client.js:17)
    at Generator.t.<computed> [as next] (client.js:17)
    at n (client.js:35)
    at client.js:35
  */

  const currentState = kittyAppStateStore.getState();
  const lastProcessedBlock = currentState.blockchain ?
    currentState.blockchain.currentBlock : null;

  const latest = await web3.eth.getBlockNumber();

  const fromBlock = lastProcessedBlock || (latest - 4000);

  session = {
      startingBlock: fromBlock,
      startingTime: Date.now(),
      latestBlock: latest
  }

  console.log({currentState, lastProcessedBlock, latest, fromBlock});

  stream.start({
    fromBlock,
    lag /* TODO: what would happen if our clients didn't match wrt lag? */
  }).then((data) => {
    session.syncDelay = Date.now() - session.startingTime;
    updateView();
  });

  // TODO: we can remove this after we can listen for updates from EventStream
  web3.eth.subscribe('newBlockHeaders', () => {
    setTimeout(updateView, 250);
  });

};



document.addEventListener("DOMContentLoaded", function() {

  document.querySelector('.start-app').addEventListener("click", function() {
    const rootElement = document.querySelector('#without-snapshot');
    const initialStateSerialized = document.querySelector('.initial-state').value;
    let initialState = null;
    let ipfsHash = null;
    try {
        initialState = JSON.parse(initialStateSerialized);
    } catch(e) { }

    // assume ipfs hash for now...
    if (initialState === null && initialStateSerialized) {
      ipfsHash = initialStateSerialized;
    }

    main(rootElement, initialState, ipfsHash)
      .catch(err => {
        console.log(err);
      });

  });
});
