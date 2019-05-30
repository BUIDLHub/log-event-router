import React from 'react';

import {
  Row,
  Col,
  Button
} from 'reactstrap';
import Range from 'Components/Range';
import * as align from 'Constants/alignments';
import cn from 'classnames';
import Select from 'react-select';

const buildRow = (label, input) => {
  return (
    <Row className={cn(align.leftCenter, align.full, align.noMarginPad)}>
      <Col md="3" className={cn(align.rightCenter, align.noMarginPad)}>
        <span className={cn("text-sz-md", "font-weight-light", "text-muted", "text-right")}>
          {label}
        </span>
      </Col>
      <Col md="9" className={cn(align.leftCenter, align.noMarginPad)}>
        {input}
      </Col>
    </Row>
  )
}

class AppSelect extends React.Component {
  render() {
    const {
      apps,
      selectedValue,
      newAppHandler,
      changeHandler
    } = this.props;
    let options = apps.map(c=>{
      return {
        label: c.name,
        value: c.id
      }
    });
    let value = options.filter(c=>c.value === selectedValue)[0];

    return (
      <Row className={cn(align.leftCenter, align.full, align.noMarginPad)}>
        <Col md="10" className={cn(align.rightCenter, "pl-2", "pr-2", align.noMarginPad)}>
          <Select className={cn(align.full)}
                  options={options}
                  value={value}
                  onChange={changeHandler} />
        </Col>
        <Col md="2" className={cn(align.leftCenter, align.noMarginPad)}>
          <i className={cn("circle-button", "fa", "fa-plus")}
                        onClick={newAppHandler} />
        </Col>
      </Row>
    )
  }
}

export default class Params extends React.Component {
  render() {
    let {
      contracts,
      paramData,
      running
    } = this.props;

    let selectedContract = paramData['contract'] || (contracts[0]?contracts[0].id:null);

    let appSelect = (
      <AppSelect apps={contracts}
                 selectedValue={selectedContract}
                 newAppHandler={this.props.newApp}
                 changeHandler={v=>this.props.update(paramData, 'contract', v.value)} />
    )

    let needsTxn = paramData['includeTxn'] || false;
    let includeTxn = (
      <input type="checkbox"
             className={cn("ml-2", align.noMarginPad)}
             checked={needsTxn}
             onChange={e=>this.props.update(paramData, 'includeTxn', e.target.checked)} />
    )

    let needsTS = paramData['includeTimestamp'] || false;
    let includeTS = (
      <input type="checkbox"
             className={cn("ml-2", align.noMarginPad)}
             checked={needsTS}
             onChange={e=>this.props.update(paramData, 'includeTimestamp', e.target.checked)} />
    )
    let start = paramData['rangeStart'];
    let totalBlocks = paramData['rangeEnd'] - start;
    let blockRange = (
      <Row className={cn("ml-2", align.full, align.leftCenter, align.noMarginPad)}>
        <Col md="8" className={cn(align.leftCenter, align.noMarginPad)}>
          <Range min={paramData['rangeMin']}
                 max={paramData['rangeEnd']}
                 value={start}
                 onChange={v=>this.props.update(paramData, 'rangeStart', v)}
          />
        </Col>
        <Col md="2" className={cn("ml-4", align.leftCenter, align.noMarginPad)}>
          <span className={cn("text-left", "text-muted", "font-weight-light", "text-1")}>
            {totalBlocks.toLocaleString()} blocks
          </span>
        </Col>
      </Row>
    )

    let refreshRate = paramData['refreshRate'];
    let rateRange = (
      <Row className={cn("ml-2", align.full, align.leftCenter, align.noMarginPad)}>
        <Col md="8" className={cn(align.leftCenter, align.noMarginPad)}>
          <Range min={10}
                 max={3000}
                 value={refreshRate}
                 onChange={v=>this.props.update(paramData, 'refreshRate', v)}
          />
        </Col>
        <Col md="2" className={cn("ml-4", align.leftCenter, align.noMarginPad)}>
          <span className={cn("text-left", "text-muted", "font-weight-light", "text-1")}>
            every {refreshRate.toLocaleString()} txns
          </span>
        </Col>
      </Row>
    )

    return (
      <Row className={cn(align.topCenter, align.full, align.noMarginPad)}>
        <Col md="10" className={cn(align.allCenter, "border-bottom", "border-muted", "mb-4", align.noMarginPad)}>
          <span className={cn("font-weight-light", "text-sz-lg")}>
            Test Params
          </span>
        </Col>

        <Col md="10" className={cn(align.leftCenter, "mb-3", align.noMarginPad)}>
          {
            buildRow("Application", appSelect)
          }
        </Col>

        <Col md="10" className={cn(align.leftCenter, "mb-3", align.noMarginPad)}>
          {
            buildRow("Include TXN Metadata", includeTxn)
          }
        </Col>
        <Col md="10" className={cn(align.leftCenter, "mb-3", align.noMarginPad)}>
          {
            buildRow("Include Timestamp", includeTS)
          }
        </Col>
        <Col md="10" className={cn(align.leftCenter, "mb-3", align.noMarginPad)}>
          {
            buildRow("Block Range", blockRange)
          }
        </Col>
        <Col md="10" className={cn(align.leftCenter, "mb-3", align.noMarginPad)}>
          {
            buildRow("UI Refresh Rate", rateRange)
          }
        </Col>

        <Col md="10" className={cn(align.allCenter, align.noMarginPad)}>
          <Button size="sm" color="primary" className={cn("mr-2")}
                  disabled={running}
                  onClick={()=>this.props.startRun(paramData)}>
                  Start
          </Button>
          <Button size="sm" color="primary"
                  disabled={!running}
                  onClick={this.props.stopRun}>
              Stop
          </Button>
        </Col>

      </Row>
    )
  }
}
