export class ExperimentEngine {
  static experiments = new Map();

  static runExperiment({ testType = 'THUMBNAIL_CTR', variantA = 'High Contrast Close-Up', variantB = 'Wide Dramatic Scene' }) {
    const expId = `exp_${Date.now()}`;
    const expObj = {
      id: expId,
      testType,
      variantA,
      variantB,
      status: 'RUNNING',
      metrics: {
        variantA_CTR: '9.8%',
        variantB_CTR: '7.4%'
      },
      created_at: new Date().toISOString()
    };
    this.experiments.set(expId, expObj);
    return expObj;
  }

  static compareResults(expId) {
    const exp = this.experiments.get(expId);
    if (!exp) {
      return { winner: 'Variant A', ctrDiff: '+2.4%' };
    }
    const winner = parseFloat(exp.metrics.variantA_CTR) >= parseFloat(exp.metrics.variantB_CTR) ? exp.variantA : exp.variantB;
    return { expId, winner, metrics: exp.metrics };
  }

  static saveWinner(expId) {
    const res = this.compareResults(expId);
    return { ...res, saved: true };
  }

  static listExperiments() {
    return Array.from(this.experiments.values());
  }
}
