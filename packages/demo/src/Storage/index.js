import LF from './LocalForage';
new LF({
  querySizeLimit: 50,
  dbPrefix: "event-stream-demo"
});
export default LF;
