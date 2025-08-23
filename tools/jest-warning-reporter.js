class WarningCounterReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.counts = { warn: 0, error: 0, act: 0 };
  }

  onRunStart() {
    this.counts = { warn: 0, error: 0, act: 0 };
  }

  onTestResult(test, testResult) {
    const buffer = testResult.console || [];
    for (const entry of buffer) {
      try {
        const type = entry.type || 'log';
        const msg = typeof entry.message === 'string' ? entry.message : String(entry.message);
        if (type === 'warn') this.counts.warn += 1;
        if (type === 'error') this.counts.error += 1;
        if (msg && msg.includes('not wrapped in act')) this.counts.act += 1;
      } catch {
        // ignore parsing issues
      }
    }
  }

  onRunComplete(contexts, results) {
    const { warn, error, act } = this.counts;
    const total = warn + error;
    const header = '\n\x1b[36m[Jest Warning Summary]\x1b[0m ';
    const line = `${header}warn=${warn}, error=${error}, act-warnings=${act}, total=${total}`;
    // eslint-disable-next-line no-console
    console.log(line);

    // Optional: enforce thresholds via env vars
    const maxTotal = process.env.JEST_WARNINGS_MAX ? Number(process.env.JEST_WARNINGS_MAX) : null;
    const failOnAct = process.env.JEST_FAIL_ON_ACT === 'true';
    if ((maxTotal != null && total > maxTotal) || (failOnAct && act > 0)) {
      results.success = false; // mark run as failed
      // eslint-disable-next-line no-console
      console.log('\x1b[31m[Jest Warning Summary] Threshold exceeded. Marking run as failed.\x1b[0m');
    }
  }
}

module.exports = WarningCounterReporter;
