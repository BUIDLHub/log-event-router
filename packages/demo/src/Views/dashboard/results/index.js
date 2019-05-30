import {connect} from 'react-redux';
import Results from './Results';

const s2p = state => {
  let current = state.speedTest.runs.current || {};

  return {
    run: current,
    running: state.speedTest.runs.running
  }
}

const d2p = dispatch => {
  return {

  }
}

export default connect(s2p, d2p)(Results);
