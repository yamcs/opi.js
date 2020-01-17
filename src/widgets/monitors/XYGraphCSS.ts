export interface DygraphsCSSOptions {
    id: string;
    titleFont: string;
    titleColor: string;
    xScaleFont: string;
    xAxisColor: string;
    xLabelFont: string;
    xLabelColor: string;
    yScaleFont: string;
    yAxisColor: string;
    yLabelFont: string;
    yLabelColor: string;
}

// Dygraphs combines CSS with JavaScript. We prefer to hide this for
export function generateCSS(options: DygraphsCSSOptions) {
    return `
#${options.id} .dygraph-legend {
  position: absolute;
  font-size: 14px;
  z-index: 10;
  width: 250px;  /* labelsDivWidth */
  /*
  dygraphs determines these based on the presence of chart labels.
  It might make more sense to create a wrapper div around the chart proper.
  top: 0px;
  right: 2px;
  */
  background: white;
  line-height: normal;
  text-align: left;
  overflow: hidden;
}

/* styles for a solid line in the legend */
#${options.id} .dygraph-legend-line {
  display: inline-block;
  position: relative;
  bottom: .5ex;
  padding-left: 1em;
  height: 1px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  /* border-bottom-color is set based on the series color */
}

/* styles for a dashed line in the legend, e.g. when strokePattern is set */
#${options.id} .dygraph-legend-dash {
  display: inline-block;
  position: relative;
  bottom: .5ex;
  height: 1px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  /* border-bottom-color is set based on the series color */
  /* margin-right is set based on the stroke pattern */
  /* padding-left is set based on the stroke pattern */
}

#${options.id} .dygraph-axis-label {
  z-index: 10;
  line-height: normal;
  overflow: hidden;
  color: black;
}

#${options.id} .dygraph-axis-label-x {
    color: ${options.xAxisColor};
    font: ${options.xScaleFont};
}

#${options.id} .dygraph-axis-label-y {
    color: ${options.yAxisColor};
    font: ${options.yScaleFont};
}

#${options.id} .dygraph-axis-label-y2 {
}

#${options.id} .dygraph-title {
  z-index: 10;
  text-align: center;
  font: ${options.titleFont}; /* sync with titleHeight */
  color: ${options.titleColor};
}

#${options.id} .dygraph-xlabel {
  text-align: center;
  color: ${options.xLabelColor};
  font: ${options.xLabelFont};
  /* font-size: based on xLabelHeight option */
}

/* For y-axis label */
#${options.id} .dygraph-label-rotate-right {
  text-align: center;
  color: ${options.yLabelColor};
  font: ${options.yLabelFont};
  transform: rotate(-90deg);
}

/* For y2-axis label */
#${options.id} .dygraph-label-rotate-left {
  text-align: center;
  transform: rotate(90deg);
}
    `;
}
