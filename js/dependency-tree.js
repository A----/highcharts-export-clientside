var group;

$('#dependency-tree').highcharts({
  title: {
    text: ""
  },
  exporting: {
    filename: "dependency-tree",
    scale: 1,
    sourceWidth: 600,
    sourceHeight: 400
  },
  chart: {
    events: {
      load: function() {
        this.redraw();
      },
      redraw: function() {

        var renderer = this.renderer,
            colors = {
              fill: {
                primary: '#337ab7',
                module: '#449d44',
                dependency: '#5cb85c',
                fileFormat: '#fff'
              },
              stroke: {
                primary: '#2e6da4',
                module: '#398439',
                dependency: '#4cae4c',
                fileFormat: '#ccc'
              },
              text: {
                primary: '#fff',
                module: '#fff',
                dependency: '#fff',
                fileFormat: '#000'
              }
            },
            area = {
              x: this.plotLeft,
              y: this.plotTop,
              w: this.plotWidth,
              h: this.plotHeight
            },
            currentGroup;
console.log(group && (group.renderer === this.renderer))
        // Now that's ugly as we reinstantiate all objects
        // each time its redrawn but it's also the easiest way.
        // Plus, a print is done in a different renderer, so we can't
        // use the same group to draw and export/print
        if(group) {
          if(group.renderer === this.renderer) {
            group.destroy();
            group = renderer.g().add();
            currentGroup = group;
          }
          else {
            currentGroup = renderer.g().add();
          }
        }
        else {
          group = renderer.g().add();
          currentGroup = group;
        }

        var drawRectangle = function(type, label, x, y) {
          var fillColor = colors.fill[type],
              strokeColor = colors.stroke[type],
              textColor = colors.text[type];

          renderer
            .label(label, area.x + area.w * x, area.y + area.h * y)
            .attr({
              fill: fillColor,
              stroke: strokeColor,
              'stroke-width': 2,
              padding: 5,
              r: 5
            })
            .css({
              color: textColor
            })
            .add(currentGroup)
            .shadow(true);
        };

        var drawLine = function(x1, y1, x2, y2) {
          renderer
            .path(['M', area.x + area.w * x1, area.y + area.h * y1, 'L', area.x + area.w * x2, area.y + area.h * y2])
            .attr({
              'stroke-width': 2,
              stroke: "black"
            })
            .add(currentGroup);
        };

        drawLine(0.6, 0.02, 0.2, 0.15); // highcharts - highcharts-export-clientside
        drawLine(0.2, 0.15, 0.10, 0.35); // highcharts-export-clientside - exporting
        drawLine(0.10, 0.35, 0.1, 0.5); // exporting - SVG
        drawLine(0.10, 0.35, 0.3, 0.55); // exporting - canvas-tools
        drawLine(0.3, 0.55, 0.25, 0.75); // canvas-tools - PNG
        drawLine(0.33, 0.55, 0.35, 0.75); // canvas-tools - JPEG
        drawLine(0.36, 0.55, 0.55, 0.80); // canvas-tools - jsPDF
        drawLine(0.54, 0.80, 0.54, 0.95); // jsPDF - PDF
        drawLine(0.3, 0.15, 0.70, 0.30); // highcharts-export-clientside - export-csv
        drawLine(0.70, 0.35, 0.67, 0.50); // export-csv - CSV
        drawLine(0.75, 0.35, 0.78, 0.50); // export-csv - XLS

        drawRectangle("primary", "HighCharts", 0.5, 0);
        drawRectangle("module", "highcharts-export-clientside", 0.1, 0.1);
        drawRectangle("dependency", "exporting", 0.05, 0.3);
        drawRectangle("fileFormat", "SVG", 0.07, 0.45);
        drawRectangle("dependency", "canvas-tools / canvg", 0.2, 0.5);
        drawRectangle("fileFormat", "PNG", 0.22, 0.7);
        drawRectangle("fileFormat", "JPEG", 0.32, 0.7);
        drawRectangle("dependency", "jsPDF", 0.50, 0.75);
        drawRectangle("fileFormat", "PDF", 0.51, 0.90);
        drawRectangle("dependency", "export-csv", 0.66, 0.3);
        drawRectangle("fileFormat", "CSV", 0.65, 0.45);
        drawRectangle("fileFormat", "XLS", 0.75, 0.45);

      }
    }
  }
});
