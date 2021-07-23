import SplunkEvents from "splunk-events";
import type { ApolloError } from "apollo-client";
import type { Config } from "splunk-events";

export class SplunkMonitoring {
  private splunkEvents: SplunkEvents | null = null;
  private vtexIO: VTEXIO | null = null;

  private config = (args: SplunkMonitoringArgs) => {
    const { token, endpoint, injectAdditionalInfo, vtexIO, ...rest } = args;

    if (!this.vtexIO && vtexIO) {
      this.vtexIO = vtexIO;
    }

    if (!this.splunkEvents) {
      this.splunkEvents = new SplunkEvents();
      this.splunkEvents.config({
        endpoint,
        token,
        injectAdditionalInfo:
          injectAdditionalInfo !== undefined ? injectAdditionalInfo : true,
        ...rest,
      });
    }

    return this.splunkEvents;
  };

  private executeFn = async (fn?: AdditionalFn) => {
    if (!fn) {
      return null;
    }

    if (isAsync(fn)) {
      return await fn();
    }

    return fn();
  };

  private shouldExecute = () => {
    if (!this.vtexIO) {
      console.warn("VTEX-specific information is not set.");

      this.vtexIO = {
        runtimeInfo: {
          account: NON_VTEX,
          workspace: NON_VTEX,
          renderMajor: 0,
          production: false,
        },
        appInfo: {
          appId: NON_VTEX,
          appVersion: NON_VTEX,
        },
      };
    }

    if (!this.splunkEvents) {
      console.error("SplunkEvent was not initialized.");

      return false;
    }

    return true;
  };

  constructor(config: SplunkMonitoringArgs) {
    this.config(config);
  }

  public logMetric = (metricLog: MetricLog) => {
    const shouldExecute = this.shouldExecute();

    if (!shouldExecute) {
      return null;
    }

    const { metricName, data, logRate, args } = metricLog;
    const { account, ...rest } = this.vtexIO!.runtimeInfo;

    if (logRate && (logRate > 100 || logRate < 0)) {
      console.error(
        "logRate should be a number greater than 0 and less than 100!"
      );

      return null;
    }

    if (logRate !== undefined && !(Math.random() <= logRate / 100)) {
      return null;
    }

    this.splunkEvents!.logEvent(
      "Important",
      "Info",
      "Track",
      metricName,
      {
        ...rest,
        ...(this.vtexIO?.appInfo ?? {}),
        ...(data ?? {}),
        ...args,
      },
      account
    );

    return this.splunkEvents;
  };

  public logGraphQLError = async (graphQLErrorLog: GraphQLErrorLog) => {
    const shouldExecute = this.shouldExecute();

    if (!shouldExecute) {
      return null;
    }

    const { error, variables, instance, type, args } = graphQLErrorLog;
    const { account, ...rest } = this.vtexIO!.runtimeInfo;

    this.splunkEvents!.logEvent(
      "Critical",
      "Error",
      type,
      instance,
      {
        ...rest,
        ...(this.vtexIO?.appInfo ?? {}),
        variables: variables && JSON.stringify(variables),
        error: error.stack ?? JSON.stringify(error),
        message: error.message,
        ...args,
      },
      account
    );

    return this.splunkEvents;
  };

  public logError = async (errorLog: ErrorLog) => {
    const shouldExecute = this.shouldExecute();

    if (!shouldExecute) {
      return null;
    }

    const { error, instance: maybeInstance, args, fn } = errorLog;
    const { account, ...rest } = this.vtexIO!.runtimeInfo;
    const instance = maybeInstance ?? "";

    const fnArgs = await this.executeFn(fn);

    this.splunkEvents!.logEvent(
      "Critical",
      "Error",
      "UnknownError",
      instance,
      {
        ...rest,
        ...(this.vtexIO?.appInfo ?? {}),
        error: error.stack ?? JSON.stringify(error),
        message: error.message,
        ...args,
        ...fnArgs,
      },
      account
    );

    return this.splunkEvents;
  };
}

export type SplunkMonitoringArgs = Omit<Config, "endpoint"> & {
  /**
   * Splunk server endpoint.
   *
   * @default public
   */
  endpoint: string;
  /**
   * VTEX IO specific data.
   *
   * Learn more on https://vtex.io/
   */
  vtexIO?: VTEXIO;
};

export type VTEXIO = {
  runtimeInfo: RuntimeInfo;
  appInfo: AppInfo;
};

export type AppInfo = {
  appId: string;
  appVersion: string;
};

export type RuntimeInfo = {
  renderMajor: number;
  workspace: string;
  production: boolean;
  account: string;
};

export type AdditionalArgs = {
  args?: EventData;
  fn?: AdditionalFn;
};

export type EventData = Record<string, string | number | undefined>;

export type AdditionalFn = (() => EventData) | (() => Promise<EventData>);

interface ErrorLog extends AdditionalArgs {
  error: Error;
  instance?: string;
}

interface GraphQLErrorLog extends AdditionalArgs {
  error: ApolloError;
  variables?: any;
  instance: string;
  type: "QueryError" | "MutationError";
}

interface MetricLog extends AdditionalArgs {
  metricName: string;
  data?: EventData;
  logRate?: number; // number between 0 and 100.
}

const NON_VTEX = "non-vtex";

function isAsync(fn: AdditionalFn) {
  return fn.constructor.name === "AsyncFunction";
}
