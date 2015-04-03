(function(H) {
  if (!H.exporting) {
    H.exporting = function() {};
  }

  // This will be redefined later;
  var oldExport = H.Chart.prototype.exportChart;
  H.Chart.prototype.exportChart = function() {};

  // Set the URL of the export server to a non-existant one, just to be sure.
  H.getOptions().exporting.url = "http://127.0.0.1:666/";

  var MIME_TYPES = {
    "PDF": "application/pdf",
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "SVG": "image/svg+xml",
    "CSV": "text/csv",
    "XLS": "application/vnd.ms-excel"
  };

  var MIME_TYPE_TO_EXTENSION = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpeg",
    "image/svg+xml": ".svg",
    "text/csv": ".csv",
    "application/vnd.ms-excel": ".xls"
  };

  var TRANSLATION_KEY_TO_MIME_TYPES = {
    "downloadPDF": "application/pdf",
    "downloadPNG": "image/png",
    "downloadJPEG": "image/jpeg",
    "downloadSVG": "image/svg+xml"
  };
  TRANSLATION_KEY_TO_MIME_TYPES[H.getOptions().lang.downloadCSV || 'Download CSV'] = "text/csv";
  TRANSLATION_KEY_TO_MIME_TYPES[H.getOptions().lang.downloadXLS || 'Download XLS'] = "application/vnd.ms-excel";

  // This var indicates if the browser supports HTML5 download feature
  var browserSupportDownload = false;
  var a = document.createElement('a');
  if (typeof window.btoa != "undefined" && typeof a.download != "undefined") {
    browserSupportDownload = true;
  }
  // This is for IE support of Blob
  var browserSupportBlob = window.Blob && window.navigator.msSaveOrOpenBlob;

  /**
   * Describes the MIME types that this module supports.
   * Additionnally, you can call `support(mimeType)` to check
   * that this type is available on the current platform.
   */
  H.exporting.MIME_TYPES = MIME_TYPES;

  var supportStatus = {};
  var buildSupportStatus = function() {
    var hasDownloadOrBlob = browserSupportDownload || browserSupportBlob;

    supportStatus[MIME_TYPES.CSV] = hasDownloadOrBlob && (H.Chart.prototype.getCSV !== undefined);
    supportStatus[MIME_TYPES.XLS] = hasDownloadOrBlob && (H.Chart.prototype.getTable !== undefined);

    var svgSupport = (H.Chart.prototype.getSVG !== undefined);

    supportStatus[MIME_TYPES.SVG] = hasDownloadOrBlob && svgSupport && (window.btoa !== undefined);

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
    rbgColorSupport && canvas.getContext && canvas.getContext('2d');

    supportStatus[MIME_TYPES.PNG] = hasDownloadOrBlob && svgSupport && canvgSupport;
    // On IE, it relies on canvas.msToBlob() which always returns PNG
    supportStatus[MIME_TYPES.JPEG] = /* useless, see last param: hasDownloadOrBlob && */
        svgSupport && canvgSupport && browserSupportDownload;

    supportStatus[MIME_TYPES.PDF] = hasDownloadOrBlob && svgSupport && canvgSupport && (typeof jsPDF !== "undefined");

  };
  buildSupportStatus();

  /**
   * Checks if the supplied MIME type is available on the
   * current platform for a chart to be exported in.
   * @param mimeType {String} The MIME type.
   * @returns {boolean} <code>true</code> if the MIME type is available on the
   *    current platform.
   */
   H.exporting.supports = function(mimeType) {
    if(supportStatus[mimeType]) {
      return supportStatus[mimeType];
    }
    else {
      return false;
    }
  };


  // Remove unsupported download features from the menu
  var menuItems = H.getOptions().exporting.buttons.contextButton.menuItems,
      menuItem,
      textKey,
      text,
      mimeType,
      handlerBuilder = function(mimeType) {
        return function() {
          this.exportChartLocal({
            type: mimeType,
            csv: {
              itemDelimiter: ';'
            }
          });
        }
      };
  for(var i in menuItems) {
    menuItem = menuItems[i];
    textKey = menuItems[i].textKey;
    text = menuItems[i].text; // export-csv do not use a textKey attribute
    mimeType = TRANSLATION_KEY_TO_MIME_TYPES[textKey] || TRANSLATION_KEY_TO_MIME_TYPES[text];
    if(mimeType) {
      if(!H.exporting.supports(mimeType)) {
        // Setting enabled = false isn't enough.
        delete menuItems[i];
      }
      else {
        // Redefines click handler to use our method.
        menuItems[i].onclick = handlerBuilder(mimeType);
      }
    }
  }

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
      if(this.bundles[i] && this.bundles[i][key] !== undefined) {
        return this.bundles[i][key];
      }
    }
    return undefined;
  };

  // Default options.
  var defaultExportOptions = {
    type: MIME_TYPES.PNG,
    scale: 2,
    filename: "chart",
    csv: {
      useLocalDecimalPoint: true
    }
  };

  /**
   * Redefines the export function of the official exporting module.
   * @param options {Object} Overload the export options defined in the chart.
   * @param chartOptions {Object} Additionnal chart options.
   */
  H.Chart.prototype.exportChartLocal = function(options, chartOptions) {
    var opt = new Opt(options, this.options.exporting, defaultExportOptions);

    var type = opt.get("type");
    if (!H.exporting.supports(type)) {
      throw new Error("Unsupported export format on this platform: " + type);
    }

    var filename = opt.get("filename") + MIME_TYPE_TO_EXTENSION[type];

    var data = {
        content: undefined,
        datauri: undefined,
        blob: undefined
      };

    if (type == MIME_TYPES.CSV) {
      // Copies some values from the options, so we can set it and change those
      // through the options argument.
      var hasCSVOptions = this.options.exporting && this.options.exporting.csv;
      var csvOpt = new Opt((options || {}).csv, (this.options.exporting || {}).csv, defaultExportOptions.csv);

      var oldOptions = {},
      optionsToCopy = ["dateFormat", "itemDelimiter", "lineDelimiter"],
      optionToCopy;
      for (var i in optionsToCopy) {
        optionToCopy = optionsToCopy[i];
        if (csvOpt.get(optionToCopy)) {
          if (!this.options.exporting) {
            this.options.exporting = {};
          }
          if (!this.options.exporting.csv) {
            this.options.exporting.csv = {};
          }

          oldOptions[optionToCopy] = this.options.exporting.csv[optionToCopy];
          this.options.exporting.csv[optionToCopy] = csvOpt.get(optionToCopy);
        }
      }

      var useLocalDecimalPoint = csvOpt.get("useLocalDecimalPoint");

      var csv = this.getCSV(useLocalDecimalPoint);
      data.content = csv;

      if (hasCSVOptions) {
        for (var i in optionsToCopy) {
          optionToCopy = optionsToCopy[i];
          if (csvOpt.get(optionToCopy)) {
            this.options.exporting.csv[optionToCopy] = oldOptions[optionToCopy];
          }
        }
      }
      else {
        delete this.options.exporting.csv;
      }
    }
    else if (type == MIME_TYPES.XLS) {
      // Same as above
      var hasCSVOptions = this.options.exporting && this.options.exporting.csv;
      var csvOpt = new Opt((options || {}).csv, (this.options.exporting || {}).csv, defaultExportOptions.csv);

      var oldOptions = {},
          optionsToCopy = ["dateFormat"],
          optionToCopy;
      for (var i in optionsToCopy) {
        optionToCopy = optionsToCopy[i];
        if (csvOpt.get(optionToCopy)) {
          if (!this.options.exporting) {
            this.options.exporting = {};
          }
          if (!this.options.exporting.csv) {
            this.options.exporting.csv = {};
          }

          oldOptions[optionToCopy] = this.options.exporting.csv[optionToCopy];
          this.options.exporting.csv[optionToCopy] = csvOpt.get(optionToCopy);
        }
      }

      var useLocalDecimalPoint = csvOpt.get("useLocalDecimalPoint");

      var xls = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
        '<x:Name>Sheet</x:Name>' +
        '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
        '<style>td{border:none;font-family: Calibri, sans-serif;} .number{mso-number-format:"0.00";}</style>' +
        '<meta name=ProgId content=Excel.Sheet>' +
        '</head><body>' +
        this.getTable(useLocalDecimalPoint) +
        '</body></html>';
      data.content = xls;

      if (hasCSVOptions) {
        for (var i in optionsToCopy) {
          optionToCopy = optionsToCopy[i];
          if (csvOpt.get(optionToCopy)) {
            this.options.exporting.csv[optionToCopy] = oldOptions[optionToCopy];
          }
        }
      }
      else {
        delete this.options.exporting.csv;
      }
    }
    // Image processing
    else {
      var scale = opt.get("scale"),
      sourceWidth = this.options.width || opt.get("sourceWidth") || this.chartWidth,
      sourceHeight = this.options.height || opt.get("sourceHeight") || this.chartHeight,
      destWidth = sourceWidth * scale,
      destHeight = sourceHeight * scale;

      var cChartOptions = chartOptions || this.options.exporting && this.options.exporting.chartOptions || {};
      if (!cChartOptions.chart) {
        cChartOptions.chart = { width: destWidth, height: destHeight };
      }
      else {
        cChartOptions.chart.width = destWidth;
        cChartOptions.chart.height = destHeight;
      }

      var svg = this.getSVG(cChartOptions);

      if (type == MIME_TYPES.SVG) {
        data.content = svg;
      }
      else if (type == MIME_TYPES.PNG || type == MIME_TYPES.JPEG) {
        var canvas = svgToCanvas(svg, destWidth, destHeight);
        data.datauri = browserSupportDownload && canvas.toDataURL && canvas.toDataURL(type);
        data.blob = (type == MIME_TYPES.PNG) && !browserSupportDownload && canvas.msToBlob && canvas.msToBlob();
      }
      else if(type == MIME_TYPES.PDF) {
        var canvas = svgToCanvas(svg, destWidth, destHeight);

        var doc = new jsPDF('l', 'mm', [destWidth, destHeight]);;
        doc.addImage(canvas, 'JPEG', 0, 0, destWidth, destHeight);

        data.datauri = browserSupportDownload && doc.output('datauristring');
        data.blob = !browserSupportDownload && doc.output('blob');
      }
    }

    if (!data.content && !(data.datauri || data.blob)) {
      throw new Error("Something went wrong while exporting the chart");
    }

    if (browserSupportDownload && (data.datauri || data.content)) {
      a = document.createElement('a');
      a.href = data.datauri || ('data:' + type + ';base64,' + window.btoa(unescape(encodeURIComponent(data.content))));
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    else if (browserSupportBlob && (data.blob || data.content)) {
      blobObject = data.blob || new Blob([data.content], { type: type });
      window.navigator.msSaveOrOpenBlob(blobObject, filename);
    }
    else {
      window.open(data);
    }
  }

  // Forces method from export module to use the local version
  H.Chart.prototype.exportChart = H.Chart.prototype.exportChartLocal;

}(Highcharts));
