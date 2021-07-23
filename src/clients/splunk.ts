import SplunkEvents from "splunk-events";
import type { ApolloError } from "apollo-client";
import type { Config } from "splunk-events";

export type SplunkMonitoringArgs = Omit<Config, "endpoint"> & {
  /**
   * Splunk server endpoint.
   *
   * @default public
   */
  endpoint: string;
  vtex?: VTEX;
};

export type VTEX = {
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

export type EventData = Record<string, string | number | undefined>;

export class SplunkMonitoring {
  private splunkEvents: SplunkEvents | null = null;
  private vtex: VTEX | null = null;

  private config = (args: SplunkMonitoringArgs) => {
    const { token, endpoint, injectAdditionalInfo, vtex, ...rest } = args;

    if (!this.vtex && vtex) {
      this.vtex = vtex;
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

  private shouldExecute = () => {
    if (!this.vtex) {
      console.warn("VTEX-specific information is not set.");

      this.vtex = {
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

    const { metricName, data, logRate } = metricLog;
    const { account, ...rest } = this.vtex!.runtimeInfo;

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
        ...(this.vtex?.appInfo ?? {}),
        ...(data ?? {}),
      },
      account
    );

    return this.splunkEvents;
  };

  public logGraphQLError = (graphQLErrorLog: GraphQLErrorLog) => {
    const shouldExecute = this.shouldExecute();

    if (!shouldExecute) {
      return null;
    }

    const { error, variables, instance, type } = graphQLErrorLog;
    const { account, ...rest } = this.vtex!.runtimeInfo;

    this.splunkEvents!.logEvent(
      "Critical",
      "Error",
      type,
      instance,
      {
        ...rest,
        ...(this.vtex?.appInfo ?? {}),
        variables: variables && JSON.stringify(variables),
        error: JSON.stringify(error),
      },
      account
    );

    return this.splunkEvents;
  };

  public logError = (errorLog: ErrorLog) => {
    const shouldExecute = this.shouldExecute();

    if (!shouldExecute) {
      return null;
    }

    const { error, instance: maybeInstance } = errorLog;
    const { account, ...rest } = this.vtex!.runtimeInfo;
    const instance = maybeInstance ?? "";

    this.splunkEvents!.logEvent(
      "Critical",
      "Error",
      "UnknownError",
      instance,
      {
        ...rest,
        ...(this.vtex?.appInfo ?? {}),
        error: error.stack ?? JSON.stringify(error),
        message: error.message,
      },
      account
    );

    return this.splunkEvents;
  };
}

interface ErrorLog {
  error: Error;
  instance?: string;
}

interface GraphQLErrorLog {
  error: ApolloError;
  variables?: any;
  instance: string;
  type: "QueryError" | "MutationError";
}

interface MetricLog {
  metricName: string;
  data?: EventData;
  logRate?: number; // number between 0 and 100.
}

const NON_VTEX = "non-vtex";
