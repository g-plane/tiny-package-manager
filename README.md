# Tiny Package Manager

> A very very simple demo and guide for explaining package manager.

## Introduction

As a JavaScript developer, you may use package manager like [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
often.

However, do you know how a package manager works? Or, you may be curious about how to build a package manager.

Well, the purpose of this guide is not to let you re-invent a new wheel.
There is no need to do that because both npm and Yarn are muture and stable enough.
The purpose is just to explain how a package manager works under the hood.
You can read the code, and the comments will explain how it works.

Note: To simplify the guide and make it as simple as possible,
this demo doesn't handle some edge cases and catch errors and exceptions.
If you are really curious about that,
it's recommended to read the source code of [npm](https://github.com/npm/npm) or [Yarn](https://github.com/yarnpkg/yarn).

## Features

- [x] Download packages to `node_modules` directory.
- [x] Simple CLI.
- [x] Simply resolve dependency conflicts.
- [x] Flatten dependencies tree.
- [x] Support lock file. (Like `yarn.lock` or `package-lock.json`)
- [x] Add a new package through CLI. (Like `yarn add` or `npm i <package>` command)
- [ ] Run lifecycle scripts. (`preinstall` and `postinstall`)
- [ ] Symlink the `bin` files.

## How to start?

Read the source code in the `src` directory.
You can read the `src/index.ts` file in the beginning.

If you would like to try this simple package manager,
just install it globally:

Via Yarn:

```
$ yarn global add tiny-package-manager
```

Via npm:

```
$ npm i -g tiny-package-manager
```

Then just go to a directory which contains valid `package.json` and run:

```
$ tiny-pm
```

## License

MIT License (c) 2018-present [Pig Fang](https://gplane.win/)
