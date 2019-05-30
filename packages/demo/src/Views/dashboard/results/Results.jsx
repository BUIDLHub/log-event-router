import React from 'react';
import * as align from 'Constants/alignments';
import cn from 'classnames';
import {
  Row,
  Col
} from 'reactstrap';
import {formatTimeLong} from 'Utils/time';


const buildRow = (label, value) => {
  if(!isNaN(value)) {
    value = (value-0).toLocaleString();
  }
  return (
    <React.Fragment>
      <Col md="3" className={cn("text-right", "font-weight-light", "text-1", "text-muted", align.leftCenter, align.noMarginPad)}>
        {label}
      </Col>

      <Col md="9" className={cn(align.leftCenter, align.noMarginPad)}>
        {value}
      </Col>
    </React.Fragment>
  )
}

const buildTimeRange = (s,e) => {
  let sTime = formatTimeLong(s);
  let eTime = formatTimeLong(e);
  return `${sTime} - ${eTime}`
}

export default class Results extends React.Component {
  render() {
    const {
      run,
      running
    } = this.props;

    let summary = run.summary || {};
    let blockRange = 0;
    if(run.rangeEnd && run.rangeStart) {
      blockRange = run.rangeEnd - run.rangeStart;
    }
    let rTime = 0;
    let txnThroughput = 0;
    if(run.endTime && run.startTime) {
      rTime = run.endTime - run.startTime;
      let inSecs = rTime/1000;
      txnThroughput = summary.txnCount / inSecs;
    }
    let blockCount = summary.blockCount || 0;
    let sTime = summary.startBlockTime || Date.now();
    let eTime = summary.endBlockTime || Date.now();

    let rpcCalls = summary.rpcCalls || 0;

    return (
      <Row className={cn(align.topCenter, align.full, align.noMarginPad)}>
        <Col md="10" className={cn(align.allCenter, align.noMarginPad)}>
          <span className={cn("font-weight-light", "text-sz-lg")}>
            Recent Test Results
          </span>
          {
            running &&
            <i className={cn("ml-2", "fa", "fa-spin", "fa-spinner")} />
          }

        </Col>

        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("Block Progress:", `${blockCount} of ${blockRange}`)}
          </div>
        </Col>

        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("Block Time Range:", buildTimeRange(sTime, eTime))}
          </div>
        </Col>

        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("TXN Count:", summary.txnCount)}
          </div>
        </Col>

        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("Event Count:", summary.eventCount)}
          </div>
        </Col>

        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("Size (in bytes):", summary.totalSize)}
          </div>
        </Col>


        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("Run Time:", `${(rTime/1000).toFixed(2)}s`)}
          </div>
        </Col>

        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("TXN Throughput:", `${(txnThroughput).toFixed(2)}/s`)}
          </div>
        </Col>

        <Col md="10" className={cn(align.leftCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.leftCenter, align.noMarginPad)}>
            {buildRow("RPC Calls:", `${rpcCalls.toLocaleString()}`)}
          </div>
        </Col>
      </Row>
    )
  }
}
