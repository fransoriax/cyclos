const OriginalDate = window.Date;

// We define a wrapper constructor to override Date behaviors without breaking standard TS typings
function createSimulatedDateConstructor() {
  const DateConstructor = function(this: any, ...args: any[]) {
    if (this instanceof DateConstructor) {
      if (args.length === 0) {
        const simulatedTime = localStorage.getItem('ct_simulated_date');
        if (simulatedTime) {
          return new OriginalDate(simulatedTime);
        }
        return new OriginalDate();
      }
      return new (OriginalDate as any)(...args);
    }
    // Called as a function: Date()
    const simulatedTime = localStorage.getItem('ct_simulated_date');
    if (simulatedTime) {
      return new OriginalDate(simulatedTime).toString();
    }
    return OriginalDate();
  };

  // Copy prototype and static methods
  (DateConstructor as any).prototype = OriginalDate.prototype;
  (DateConstructor as any).now = () => {
    const simulatedTime = localStorage.getItem('ct_simulated_date');
    return simulatedTime ? new OriginalDate(simulatedTime).getTime() : OriginalDate.now();
  };
  (DateConstructor as any).UTC = OriginalDate.UTC;
  (DateConstructor as any).parse = OriginalDate.parse;

  return DateConstructor;
}

window.Date = createSimulatedDateConstructor() as any;

export {};
