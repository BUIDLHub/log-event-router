import {Creators} from './actions';
import {default as streamOps} from 'Redux/stream/operations';
import {default as chainOps} from 'Redux/chain/operations';
import {default as eventOps} from 'Redux/events/operations';

const initStreams = props => {
  return props.dispatch(streamOps.init())
        .then(()=>props)
}

const initChain = props => {
  return props.dispatch(chainOps.init())
        .then(()=>props);
}

const initEvents = props => {
  return props.dispatch(eventOps.init())
        .then(()=>props);
}

const startStream = props => {
  return props.dispatch(streamOps.start())
          .then(()=>props);
}

const start = () => (dispatch,getState) => {
  let state = getState();
  if(state.init.initComplete) {
    return;
  }

  return dispatch(_doStart());
}

const _doStart = () => (dispatch,getState) => {
  dispatch(Creators.initStart());
  let props = {
    dispatch,
    getState
  }
  initChain(props)
  .then(initStreams)
  .then(initEvents)
  .then(startStream)
  .then(()=>{
    dispatch(Creators.initSuccess());
  });
}

const unload  = () => (dispatch,getState) => {

}

export default {
  start,
  unload
}
