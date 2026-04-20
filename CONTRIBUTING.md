# Contributing

The full contributing guide lives in the [README's Contributing section](./README.md#contributing). Short version:

## If you're adapting it for yourself or a classroom

Fork freely. Rip out what you don't need, change the aesthetic, rewrite the prompts in your own voice. No need to ask or upstream.

## If you're improving the main project

- **Bugs and feature ideas** — open an [issue](https://github.com/kandizzy/possible-futures/issues/new/choose). Use the templates; they ask for what I need (Node version, API vs CLI mode, reproduction steps).
- **Pull requests** — fork, branch from `main`, and keep changes scoped. One concern per PR. Before opening, run these locally and make sure all three pass:

    ```bash
    npm run lint
    npm run test
    npm run build
    ```

- **Tests** — anything that touches scoring, parsing, or database queries should come with a Vitest test. See the existing suites under `src/**/__tests__/` for the pattern.
- **Style** — match the editorial aesthetic (see `/colophon` in the running app). New components should reuse the `paper`, `ink`, `rule`, and `stamp` theme tokens in `src/app/globals.css` rather than introduce raw hex colors.
- **Scope** — this app is deliberately local-first and single-user. Features that require a hosted backend, analytics, or multi-tenant state are out of scope. Features that reduce the cognitive load of a job search are very much in scope.

By submitting a contribution to the main project you agree to license it under the same terms as the project (MIT).

## See also

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)
