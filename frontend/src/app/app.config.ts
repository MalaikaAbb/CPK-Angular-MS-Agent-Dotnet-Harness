import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideCopilotKit,
  type SandboxFunction,
} from '@copilotkit/angular';
import { z } from 'zod';

import { routes } from './app.routes';
import { catalog } from './features/a2ui/a2ui-catalog';

// frontend tools : open generative ui host function start
const setDashboardFilter: SandboxFunction<{ filter: string }> = {
  name: 'setDashboardFilter',
  description: 'Set the active dashboard filter',
  parameters: z.object({ filter: z.string() }),
  handler: async ({ filter }) => {
    sessionStorage.setItem('dashboard-filter', filter);
    return { applied: filter };
  },
};
// frontend tools : open generative ui host function end


/**
 * One provider at the application root, so a conversation started on any demo
 * route continues on every other route.
 *
 * `runtimeUrl` points at the Copilot Runtime from the quickstart — the
 * supported path, where the browser never talks to the Microsoft Agent
 * Framework agent directly. The `HttpAgent` binding that reaches the Agent
 * Framework AG-UI endpoint lives server-side in frontend/server.ts.
 *
 * `a2ui.catalog` / `a2ui.recovery` and `openGenerativeUI.sandboxFunctions` are
 * the A2UI and generative-UI guide options. The catalog is the A2UI guide's
 * "Use existing web components" one; supplying a catalog is what registers the
 * render_a2ui renderer.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideClientHydration(),
    // quickstart : connect to copilot runtime start
    provideCopilotKit({
      runtimeUrl: 'http://localhost:8250/api/copilotkit',
      // a2ui : recover incomplete streams start
      a2ui: {
        // The guide's app.config sample passes `catalog: productCatalog`,
        // which it never defines. The one catalog it does build is the
        // "Use existing web components" one (features/a2ui/a2ui-catalog.ts),
        // so that is the catalog passed here.
        catalog,
        recovery: { showAfterMs: 2_000, showAfterAttempts: 2 },
      },
      // a2ui : recover incomplete streams end
      // frontend tools : open generative ui start
      openGenerativeUI: {
        // `sandboxFunctions` is typed `SandboxFunction[]`, i.e.
        // `SandboxFunction<Record<string, unknown>>[]`, so the guide's
        // `SandboxFunction<{ filter: string }>` is not assignable to it as
        // written. Cast at the array site, the same idiom the docs use for the
        // equivalent `component` variance problem. See README known issues.
        sandboxFunctions: [setDashboardFilter as unknown as SandboxFunction],
      },
      // frontend tools : open generative ui end
    }),
    // quickstart : connect to copilot runtime end
  ],
};
