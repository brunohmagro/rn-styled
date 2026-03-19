# Publishing

This repository uses Changesets to publish `@rn-styled/core` and `@rn-styled/styled`.

## Before first publish

1. Make sure you are logged in to npm:

```bash
npm login
```

2. Make sure you have permission to publish under the `@rn-styled` scope.

3. Confirm package metadata is ready:
- package names
- README files
- license
- repository URL

## Release validation

Run:

```bash
pnpm release:check
```

This validates:
- lint
- tests
- builds
- package tarball contents via `npm pack --dry-run`

## First publish

If these packages have never been published before, current versions can be published directly:

```bash
pnpm release
```

`changeset publish` will publish the versions already present in each package if they are unpublished.

## Future releases

1. Create a changeset:

```bash
pnpm changeset
```

2. Version packages:

```bash
pnpm version-packages
```

3. Publish:

```bash
pnpm release
```

## Verify published packages

After publish:

```bash
npm view @rn-styled/core version
npm view @rn-styled/styled version
```
