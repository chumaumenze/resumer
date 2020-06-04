const serverlessChrome = require("chrome-aws-lambda");
const puppeteer = require("puppeteer");
const plugins = require("relaxedjs/src/plugins");
const path = require("path");
const pug = require("pug");

class Result {
  constructor(rv, err) {
    this.rv = rv;
    this.err = err;
  }
}

class HTML2PDF {
  constructor() {
    let args = [
      "--no-sandbox",
      "--disable-translate",
      "--disable-extensions",
      "--disable-sync",
    ];
    args = [...new Set([...args, ...serverlessChrome.args])];
    this.puppeteerConfig = {
      headless: true,
      args: args,
      executablePath: "/tmp/chromium",
      defaultViewport: serverlessChrome.defaultViewport,
      ignoreHTTPSErrors: true,
    };

    this.relaxedGlobals = {
      busy: false,
      config: {},
      configPlugins: [],
    };

    this._initializedPlugins = false;
  }

  async _initializePlugins() {
    if (this._initializedPlugins) return; // Do not initialize plugins twice
    for (const [i, plugin] of plugins.builtinDefaultPlugins.entries()) {
      plugins.builtinDefaultPlugins[i] = await plugin.constructor();
    }
    await plugins.updateRegisteredPlugins(this.relaxedGlobals, "/");

    this.puppeteerConfig.executablePath = await serverlessChrome.executablePath;
    this._initializedPlugins = true;
  }

  async getBrowser(fn, keepAlive = false) {
    await this._initializePlugins();
    let chromium = null;
    try {
      chromium = await puppeteer.launch(this.puppeteerConfig);
    } catch (e) {
      console.error(e.stack);
      console.info("There was a Puppeteer error. (see above)");
    }
    let resp = new Result();
    try {
      resp = await fn(chromium);
    } catch (e) {
      let isPossibleTimeOut = e.message.indexOf("Timeout") > 0;
      let message = `PDF generation failed.`;
      console.error(e.stack);
      console.info(message);
      message = isPossibleTimeOut
        ? `${message} Possible timeout error`
        : message;
      resp.err = message;
      return resp;
    } finally {
      if (chromium !== null && !keepAlive) {
        await chromium.close();
      }
    }
    return resp;
  }

  async getPDFOptions(page) {
    let defaultHeaderFooter = "<span></span>";
    const header = await page
      .$eval("#page-header", (element) => element.innerHTML)
      .catch((error) => defaultHeaderFooter);
    const footer = await page
      .$eval("#page-footer", (element) => element.innerHTML)
      .catch((error) => defaultHeaderFooter);

    let options = {
      headerTemplate: header,
      footerTemplate: footer,
      printBackground: true,

      // Display when either header/footer template are available
      displayHeaderFooter: !!(header || footer),
    };

    function getMatch(htmlString, query) {
      let result = htmlString.match(query);
      if (result) {
        result = result[1];
      }
      return result;
    }

    let html = await page.content();
    const width = getMatch(html, /-relaxed-page-width: (\S+);/m);
    const height = getMatch(html, /-relaxed-page-height: (\S+);/m);
    const size = getMatch(html, /-relaxed-page-size: (\S+);/m);
    width && (options.width = width);
    height && (options.height = height);
    size && (options.size = size);

    let pluginHooks = this.relaxedGlobals.pluginHooks;
    for (let pageModifier of pluginHooks.pageModifiers) {
      await pageModifier.instance(page);
    }

    for (let pageModifier of pluginHooks.page2ndModifiers) {
      await pageModifier.instance(page);
    }

    return options;
  }

  async translatePug2HTML(pugString, pugOptions) {
    await this._initializePlugins();
    let pluginHooks = this.relaxedGlobals.pluginHooks;
    let pluginPugHeaders = [];
    pluginHooks.pugHeaders.forEach((pugHeader) => {
      pluginPugHeaders.push(pugHeader.instance);
    });
    pluginPugHeaders = pluginPugHeaders.join("\n\n");

    let pugFilters = Object.assign(
      ...pluginHooks.pugFilters.map((o) => o.instance)
    );

    let html;
    try {
      html = pug.render(
        pluginPugHeaders + "\n" + pugString,
        Object.assign({}, pugOptions ? pugOptions : {}, {
          // filename: masterPath,

          // Other params
          fs: require("fs"),
          basedir: this.relaxedGlobals.basedir,
          cheerio: require("cheerio"),
          __root__: path.resolve(__dirname),
          path: path,
          require: require,
          performance: require("perf_hooks"),
          filters: pugFilters,
        })
      );
    } catch (error) {
      console.error(error.stack);
      console.info("There was a Pug error (see above)");
    }
    return html;
  }

  async fromURL(url, timeOut) {
    return await this.getBrowser(async (chromium) => {
      let resp = new Result();
      let page = await chromium.newPage();
      await page.goto(url, {
        waitUntil: ["load", "domcontentloaded"],
        timeout:
          1000 *
          (timeOut ||
            process.env.PAGE_TIMEOUT ||
            this.relaxedGlobals.config.pageRenderingTimeout),
      });

      // Set PDF Options from Browser page
      let pdfOptions = await this.getPDFOptions(page);
      resp.rv = await page.pdf(pdfOptions);
      return resp;
    });
  }

  async fromTemplate(templateString, templateType, timeOut) {
    if (templateType === "pug") {
      templateString = await this.translatePug2HTML(templateString);
    }
    return await this.getBrowser(async (chromium) => {
      let resp = new Result();
      let page = await chromium.newPage();
      await page.setContent(templateString, {
        waitUntil: ["load", "domcontentloaded"],
        timeout:
          1000 *
          (timeOut ||
            process.env.PAGE_TIMEOUT ||
            this.relaxedGlobals.config.pageRenderingTimeout),
      });

      // Set PDF Options from Browser page
      let pdfOptions = await this.getPDFOptions(page);
      resp.rv = await page.pdf(pdfOptions);
      return resp;
    });
  }

  async run(value, type, format) {
    let resp = {
      status: "success",
      message: "PDF generated successfully.",
      data: {
        pdf: null,
        log: null,
      },
    };
    let data;
    switch (type) {
      case "url": {
        data = await this.fromURL(value);
        break;
      }
      case "string": {
        if (["pug", "html"].includes(format)) {
          data = await this.fromTemplate(value, format);
        } else {
          data = { rv: null, err: "Invalid input format specified." };
        }
        break;
      }
      default: {
        data = { rv: null, err: "Invalid type specified." };
      }
    }
    if (data.rv) {
      resp.data.pdf = `data:application/pdf;base64,${data.rv.toString(
        "base64"
      )}`;
    } else {
      resp.status = "failure";
      resp.message = data.err;
    }
    return resp;
  }
}

const html2pdf = new HTML2PDF();
exports.main = async (event, context, callback) => {
  return await html2pdf.run(event.value, event.type, event.format);
};
