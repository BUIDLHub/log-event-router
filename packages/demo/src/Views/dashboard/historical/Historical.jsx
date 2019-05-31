import React from 'react';
import {Bar} from 'react-chartjs-2';
import {
  Row,
  Col,
  Button
} from 'reactstrap';
import * as align from 'Constants/alignments';
import cn from 'classnames';

const MB = 1000 * 1024;

const yAxesTemplate = [
  {
    type: 'linear',
    display: true,
    position: 'left',
    id: 'y-axis-1',
    gridLines: {
      display: false
    },
    labels: {
      show: true
    },
    ticks: {
        // Include a dollar sign in the ticks
        callback: function(value, index, values) {
            return value.toLocaleString()
        }
    },
    scaleLabel: {
      display: true,
      labelString: "Blocks"
    }
  },
  {
    type: 'linear',
    display: true,
    position: 'right',
    id: 'y-axis-2',
    gridLines: {
      display: false
    },
    labels: {
      show: true
    },
    ticks: {
        // Include a dollar sign in the ticks
        callback: undefined
    },
    scaleLabel: {
      display: true,
      labelString: "replace"
    }
  }
]

const options = {
  responsive: true,
  tooltips: {
    mode: 'label'
  },
  elements: {
    line: {
      fill: false
    }
  },
  scales: {
    xAxes: [
      {
        scaleLabel: {
          display: true,
          labelString: "Time of Test"
        },
        display: true,
        gridLines: {
          display: false
        }
      }
    ],

  }
};

const bar = {
  labels: [],
  datasets: [{
      label: '',
      type:'line',
      data: [],
      fill: false,
      borderColor: '#EC932F',
      backgroundColor: '#EC932F',
      pointBorderColor: '#EC932F',
      pointBackgroundColor: '#EC932F',
      pointHoverBackgroundColor: '#EC932F',
      pointHoverBorderColor: '#EC932F',
      yAxisID: 'y-axis-2'
    },{
      type: 'bar',
      label: '',
      data: [],
      fill: false,
      backgroundColor: '#71B37C',
      borderColor: '#71B37C',
      hoverBackgroundColor: '#71B37C',
      hoverBorderColor: '#71B37C',
      yAxisID: 'y-axis-1'
    }]
};

export default class Historical extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focus: "size"
    };
    [
      'changeFocus'
    ].forEach(fn=>this[fn] = this[fn].bind(this));
  }

  changeFocus(f) {
      this.setState({
        focus: f
      });
  }

  render() {
    const {
      data,
      timeLabels
    } = this.props;
    let dataset = data[this.state.focus];
    let blockCounts = data["blockCount"];

    let focus = null;
    let timeColor = "secondary";
    let sizeColor = "secondary";
    let callColor = "secondary";

    switch(this.state.focus) {
      case 'time': {
        focus = "Run Time";
        timeColor = "primary";
        break;
      }

      case 'size': {
        focus = "Total Size (MB)";
        sizeColor = "primary";
        let d = dataset.map(s=>s/MB);
        dataset = d;
        break;
      }

      case 'calls': {
        focus = "RPC Calls";
        callColor = "primary";
        break;
      }

      default: {
        focus = "Run Time";
        timeColor = "primary";
        break;
      }
    }

    let barData = {
      ...bar,

      labels: timeLabels,


      datasets: [
        {
          ...bar.datasets[0],
          label: focus,
          data: dataset
        },
        {
          ...bar.datasets[1],
          label: "Blocks",
          data: blockCounts
        }
      ]
    };

    let yAxes = [
      ...yAxesTemplate
    ]
    yAxes[1].scaleLabel.labelString = focus;
    yAxes[1].ticks.callback = (val) => {
      if(this.state.focus === 'size') {
        return val.toFixed(2);
      } else {
        return val.toLocaleString();
      }
    }

    let opts = {
      ...options,
      scales: {
        ...options.scales,
        yAxes
      }
    }

    return (
      <Row className={cn(align.topCenter, align.full, align.noMarginPad)}>
        <Col md="10" className={cn("mb-4", "border-bottom", "border-muted", align.topCenter, align.noMarginPad)}>
          <div className={cn(align.full, align.allCenter, align.noMarginPad)}>
            <Col md="4" className={cn(align.noMarginPad)}>&nbsp;</Col>
            <Col md="4" className={cn(align.allCenter, align.noMarginPad)}>
              <span className={cn("font-weight-light", "text-sz-lg")}>
                Recent Tests
              </span>
            </Col>
            <Col md="4" className={cn("text-right", align.rightCenter, align.noMarginPad)}>
              <i className={cn("fa", "fa-trash", "clickable-icon")}
                 onClick={()=>{
                   if(window.confirm("Remove selected application's test runs?")) {
                     this.props.clearRuns();
                   }
                 }}/>
            </Col>
          </div>

        </Col>

        <Col md="10" className={cn("mb-2", align.allCenter, align.noMarginPad)}>
          <span className={cn("mr-1", "text-muted", "text-1", "font-weight-light")}>
           compare by:
          </span>

          <Button size="sm"
                  color={timeColor}
                  onClick={()=>this.changeFocus("time")}
                  className={cn("mr-1")}>
            Time
          </Button>
          <Button size="sm"
                  color={sizeColor}
                  onClick={()=>this.changeFocus("size")}
                  className={cn("mr-1")}>
            Size
          </Button>
          <Button size="sm"
                  color={callColor}
                  onClick={()=>this.changeFocus("calls")}>
            Calls
          </Button>
        </Col>

        <Col md="10" className={cn(align.topCenter, align.noMarginPad)}>
          <Bar data={barData} options={opts}/>
        </Col>
      </Row>
    )
  }
}
