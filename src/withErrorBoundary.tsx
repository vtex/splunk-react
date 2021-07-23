import React from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import type { ComponentType, ComponentProps } from "react";
import { AdditionalArgs, SplunkMonitoring } from "./clients/splunk";

/**
 * A HOC wrapper on top of the **logError** function that will log whenever the component **componentDidCatch**.
 *
 * @example
 * ```tsx
 * import { monitoring, withErrorBoundary } from 'splunk-react'
 *
 * const App = () => <div>Hello world</div>
 *
 * const monitoring = SplunkMonitoring(config)
 *
 * export default withErrorBoundary(monitoring)(App)
 * ```
 */
export function withErrorBoundary(
  splunk: SplunkMonitoring,
  /**
   * Additional arguments to log to Splunk.
   */
  additionalArgs?: AdditionalArgs
) {
  return function withBoundary<TProps>(
    WrappedComponent: ComponentType<TProps>
  ): ComponentType<TProps> {
    const wrappedComponentName =
      (WrappedComponent.displayName ?? WrappedComponent.name) || "Component";

    class WithErrorBoundary extends React.Component<
      ComponentProps<typeof WrappedComponent>
    > {
      public static readonly displayName = `WithErrorBoundary(${wrappedComponentName})`;

      public async componentDidCatch(error: Error) {
        splunk.logError({
          error,
          args: additionalArgs?.args,
          fn: additionalArgs?.fn,
        });

        throw error;
      }

      public render() {
        return <WrappedComponent {...this.props} />;
      }
    }

    return hoistNonReactStatics<
      ComponentType<ComponentProps<typeof WrappedComponent>>,
      ComponentType<TProps>
    >(WithErrorBoundary, WrappedComponent);
  };
}
