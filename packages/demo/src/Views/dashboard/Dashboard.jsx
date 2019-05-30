import React from 'react';
import {
  Row,
  Card,
  CardBody
} from 'reactstrap';

import * as align from 'Constants/alignments'
import cn from 'classnames';

import Results from './results';
import Params from './params'
import AddApp from './apps';
import Historical from './historical';

export default class Dashboard extends React.Component {
  render() {

    return (
      <Row className={cn("dashboard", align.topCenter, align.full, align.noMarginPad)}>
        <AddApp />

        <div className={cn("toolbar", "border-bottom", "border-muted", align.allCenter, align.full, align.noMarginPad)} style={{minHeight: '100px'}}>
          <span className={cn("font-weight-bold", "text-sz-lg")}>
            App Sync Test
          </span>
        </div>

        <Card className={cn(align.topCenter, "w-80", "mt-3", align.noMarginPad)}>
          <CardBody className={cn(align.full)}>
            <Params />
          </CardBody>
        </Card>

        <Card className={cn(align.topCenter, "w-80", "mt-3", align.noMarginPad)}>
          <CardBody className={cn(align.full)}>
            <Results />
          </CardBody>
        </Card>

        <Card className={cn(align.topCenter, "w-80", "mt-3", "mb-5", align.noMarginPad)}>
          <CardBody className={cn(align.full)}>
            <Historical />
          </CardBody>
        </Card>
      </Row>
    )

  }
}
