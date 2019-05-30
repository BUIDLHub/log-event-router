import React from 'react';
import {
  Input,
  Col
} from 'reactstrap';
import _ from 'lodash';
import * as align from 'Constants/alignments';
import cn from 'classnames';

const DEBOUNCE_TIME = 300;

export default class Range extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rangeValue: 0
    };
    [
      'update',
      'notifyValue'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
    this.notifyValue = _.debounce(this.notifyValue, DEBOUNCE_TIME, {trailing: true});
  }

  update(value) {
    this.setState({
      rangeValue: value
    });
    this.notifyValue(value);
  }

  notifyValue() {
    this.props.onChange(this.state.rangeValue);
  }

  render() {
    const {
      min,
      max,
      value,
      className
    } = this.props;

    let selValue = this.state.rangeValue-0 || value-0;
    let minAsString = min.toLocaleString();
    let maxAsString = max.toLocaleString();
    return (
      <div className={cn("rangeSelector", className, align.topCenter, align.full, align.noMarginPad)}>

        <div className={cn(align.leftCenter, align.full, align.noMarginPad)}>
          <Col md="12" className={cn(align.leftCenter, align.noMarginPad)}>
            <Input type="range"
                   className={cn("noFocusBorder", align.noMarginPad)}
                   min={min}
                   max={max}
                   value={selValue}
                   onChange={e=>this.update(e.target.value)} />
          </Col>

        </div>

        <div className={cn(align.leftCenter, align.full, align.noMarginPad)}>
          <Col md="6" className={cn(align.leftCenter, align.noMarginPad, "text-left", "text-1", "text-muted")}>
            {minAsString}
          </Col>
          <Col md="6" className={cn(align.rightCenter, align.noMarginPad, "text-right", "text-1", "text-muted")}>
            {maxAsString}
          </Col>
        </div>

      </div>
    )
  }
}
