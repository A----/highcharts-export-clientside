# highcharts-export-clientside
Module for [HighCharts](http://www.highcharts.com/) to exports charts client-side.

> :warning: This project is not thoroughly tested. It just happens to work in my cases (charts & environments). Please submit pull requests & issues!

You may need to export a chart you made using HighCharts to an image or a PDF. It has an exporting module but it relies on an export server, which by default is http://export.highcharts.com/ and you also –unlucky you– have one or more of the following:
* your app doesn't have access to the intertubes;
* your chart contains sensitive data and you don't want an unsecure channel to carry it;
* sensitive data or not, you don't trust HighCharts with it;
* it's against your company policies;
* you don't want to set an export server up;
* you think it's 2015 and FFS, _browsers should be able to do that_.

## Build / Install

Dependencies are not shipped, so you'll have to do the following:

```(sh)
bower install
```

Boom, you're done. Check the ```example.html``` file and mess with it.

Or just get `highcharts-export-clientside.js`.

## Dependencies

This module depends on:
* [HighCharts](http://www.highcharts.com/) obviously, remember guys, it isn't free for commercial usages;
* its exporting module, that is bundle with it;
* for rasterized images (PNG, JPEG), a module called `canvas-tools` with is based<sup>1</sup> on [canvg](https://github.com/gabelerner/canvg) licenced under MIT Licence;
* [jsPDF](https://parall.ax/products/jspdf) (its GitHub page is [overthere](https://github.com/MrRio/jsPDF)) for PDF support, licenced under MIT Licence.

The only dependencies you must use are HighCharts and HighCharts exporting module. If you want PNG/JPEG, add `canvas-tools`. If you want PDF support, add both `canvas-tools` and `jsPDF`. If a dependency is missing for a file type, the option will not be available in the export menu.

<sup>1</sup>: There are issues with canvg, title/subtitle appearing twice, this kind of things which `canvas-tools` fixes. So I'd suggest to go with this one.

## Remarks, Issues, Other stuff

* ~~Rasterized images have an aspect ratio issue. I probably made a boo-boo somewhere.~~ That's fixed.
* This probably won't work on Internet Explorer has it uses HTML5 download feature and opens a data-uri as a fallback. ~~But IE has limited data-uri support so who knows.~~ Nope, but there are some shim/sham/polyfills so that's possible to do.
* When exporting into PDF, `sourceWidth` and `sourceHeight` are expressed in millimeters.

## Credits

Written with the help of the following resources:
* that  [Stack Overflow Q/A](http://stackoverflow.com/questions/25630811/export-highcharts-to-pdf-using-javascript-and-local-server-no-internet-connec) and this [snippet/project](https://github.com/leighquince/HighChartLocalExport/) by @leighquince;
* this [JSFiddle](http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/exporting/offline-download/) from the official [HighCharts documentation](http://www.highcharts.com/docs/export-module/export-module-overview)
