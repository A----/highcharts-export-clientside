(function(H) {
  H.export = function() {};

  var MIME_TYPES = {
    "PDF": "application/pdf",
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "SVG": "image/svg+xml"
  };

  var MIME_TYPE_TO_EXTENSION = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpeg",
    "image/svg+xml": ".svg"
  };

  var TRANSLATION_KEY_TO_MIME_TYPES = {
    "downloadPDF": "application/pdf",
    "downloadPNG": "image/png",
    "downloadJPEG": "image/jpeg",
    "downloadSVG": "image/svg+xml"
  };

  // This var indicates if the browser supports HTML5 download feature
  var browserSupportDownload = false;
  var a = document.createElement('a');
  if (typeof a.download != "undefined") {
    browserSupportDownload = true;
  }

  /**
   * Describes the MIME types that this module supports.
   * Additionnally, you can call `support(mimeType)` to check
   * that this type is available on the current platform.
   */
  H.export.MIME_TYPES = MIME_TYPES;

  /**
   * Checks if the supplied MIME type is available on the
   * current platform for a chart to be exported in.
   * @param mimeType {String} The MIME type.
   * @returns {boolean} <code>true</code> if the MIME type is available on the
   *    current platform.
   */
  H.export.supports = function(mimeType) {
    if(H.Chart.prototype.getSVG === undefined) {
      return false;
    }

    if(mimeType == MIME_TYPES.SVG) {
      return window.btoa !== undefined;
    }

    // Canvg uses a function named RGBColor, but it's also a not widely known standard object
    // http://www.w3.org/TR/2000/REC-DOM-Level-2-Style-20001113/css.html#CSS-RGBColor
    // Fugly, but heh.
    var rbgColorSupport = false;
    try {
      rbgColorSupport = (new RGBColor("").ok) !== undefined;
    }
    catch(e) {}
    // We also check that a canvas element can be created.
    var canvas = document.createElement('canvas');
    var canvgSupport = typeof canvg !== "undefined" && typeof RGBColor != "undefined" &&
      rbgColorSupport && canvas.getContext && canvas.getContext('2d')

    if(mimeType == MIME_TYPES.PNG || mimeType == MIME_TYPES.JPEG) {
      return canvgSupport;
    }
    else if(mimeType == MIME_TYPES.PDF) {
      var canvas = document.createElement('canvas');
      return canvgSupport && typeof jsPDF !== "undefined";
    }
    else {
      return false;
    }
  };

  /*
   * Converts a SVG string to a canvas element
   * thanks to canvg.
   * @param svg {String} A SVG string.
   * @param width {Integer} The rasterized width.
   * @param height {Integer} The rasterized height.
   * @return {DOMNode} a canvas element.
   */
  var svgToCanvas = function(svg, width, height) {
    var canvas = document.createElement('canvas');

    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    canvas.getContext('2d').drawSvg(svg, 0, 0, width, height);

    return canvas;
  };

  /**
   * An object to simplifies the retrieval of options in
   * multiple bundles.
   * @param opts {Object} Multiple, an object containing options.
   */
  var Opt = function(opts1, opt2, dotdotdot) {
    this.bundles = arguments;
  };

  /**
   * Fetch the value associated with the specified key in the bundles.
   * First one defined is the one returned.
   * @param key {String} The key.
   * @param value {mixed} The first defined value in the bundles or
   *    <code>undefined</code> if none is found.
   */
  Opt.prototype.get = function(key) {
    for(var i = 0; i < this.bundles.length; i++) {
      if(this.bundles[i] && this.bundles[i][key]) {
        return this.bundles[i][key];
      }
    }
    return undefined;
  };

  // Default options.
  var defaultExportOptions = {
    type: MIME_TYPES.PNG,
    scale: 2,
    filename: "chart"
  };

  var oldExport = H.Chart.prototype.exportChart;
  /**
   * Redefines the export function of the official exporting module.
   * @param options {Object} Overload the export options defined in the chart.
   * @param chartOptions {Object} Additionnal chart options.
   */
  H.Chart.prototype.exportChart = function(options, chartOptions) {
    var opt = new Opt(options, this.options.exporting, defaultExportOptions);

    var type = opt.get("type");
    if (!H.export.supports(type)) {
      throw new Error("Unsupported export format on this platform: " + type);
    }

    var filename = opt.get("filename") + MIME_TYPE_TO_EXTENSION[type];

    var scale = opt.get("scale"),
      sourceWidth = this.options.width || opt.get("sourceWidth") || this.chartWidth,
      sourceHeight = this.options.height || opt.get("sourceHeight") || this.chartHeight,
      destWidth = sourceWidth * scale,
      destHeight = sourceHeight * scale;

    var data = false;

    var cChartOptions = chartOptions || this.options.exporting && this.options.exporting.chartOptions || {};
    if(!cChartOptions.chart) {
      cChartOptions.chart = { width: destWidth, height: destHeight };
    }
    else {
      cChartOptions.chart.width = destWidth;
      cChartOptions.chart.height = destHeight;
    }

    var svg = this.getSVG(cChartOptions);

    if (type == MIME_TYPES.SVG) {
      data = "data:" + MIME_TYPES.SVG + "," + svg;
    }
    else if (type == MIME_TYPES.PNG || type == MIME_TYPES.JPEG) {
      var canvas = svgToCanvas(svg, destWidth, destHeight);
      data = canvas.toDataURL(type);
    }
    else if(type == MIME_TYPES.PDF) {
      var canvas = svgToCanvas(svg, destWidth, destHeight);
      var imageData = canvas.toDataURL(MIME_TYPES.JPEG);

      var doc = new jsPDF('l', 'mm', [destWidth, destHeight]);;
      doc.addImage(imageData, 'JPEG', 0, 0, destWidth, destHeight);

      data = doc.output('datauristring');
    }

    if (browserSupportDownload) {
      a = document.createElement('a');
      a.href = data;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    else {
      window.open(data);
    }
  }

  // Set the URL of the export server to a non-existant one, just to be sure.
  H.getOptions().exporting.url = "http://127.0.0.1:666/"

  // Remove unsupported download features
  var menuItems = H.getOptions().exporting.buttons.contextButton.menuItems,
      menuItem,
      textKey;
  for(var i in menuItems) {
    menuItem = menuItems[i];
    textKey = menuItems[i].textKey;
    if(TRANSLATION_KEY_TO_MIME_TYPES[textKey]) {
      if(!H.export.supports(TRANSLATION_KEY_TO_MIME_TYPES[textKey])) {
        // Setting enabled = false isn't enough.
        delete menuItems[i];
      }
    }
  }

}(Highcharts));
