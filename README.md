# dedukti-editor [![Build Status](https://travis-ci.com/lachhebo/dedukti-editor.svg?branch=master)](https://travis-ci.com/lachhebo/dedukti-editor) [![Dependency Status](https://david-dm.org/lachhebo/dedukti-editor.svg)](https://david-dm.org/lachhebo/dedukti-editor)

## Installation

You need Atom >= 1.21. Then run:

```
$ apm install atom-ide-ui lachhebo/dedukti-editor
```

This will place both packages in `~/.atom/packages`.

### Installing the Dedukti Language Server:

`dedukti-editor` needs a language server for Dedukti. The easiest method is to use the [OPAM](https://opam.ocaml.org/) package manager:
```
$ opam repository add deducteam https://scm.gforge.inria.fr/anonscm/git/opam-deducteam/opam-deducteam.git
$ opam install lambdapi-lsp
```

## Utilisation

### Features

- [x] Check proofs
- [x] Display errors message where errors spring from
- [x] List the unresolved goals depending on the position of the cursor
- [x] List the hypothesis linked to th current goal
- [x] Buttons and key bindings to navigate within a proof
- [x] Basic synthax for dk file
- [x] Style manager
- [x] Unicode caracters manager
- [ ] Incremental updates
- [ ] Update Manually

### Keybindings :

| Key |  Action |
|--|--|
| alt-down | Next step |
| alt-up | Last step |

## Development instructions

If you want to contribute to development of the mode you can clone
this repository from GitHub:

```
$ git clone https://github.com/lachhebo/dedukti-editor.git
$ cd dedukti-editor
$ apm install
$ apm link
```

Note that `apm install` will also place the `git` repository in
`~/.atom/packages/dedukti-editor/`

### Debug :

To debug, open a developper console (Ctrl+Shift+I) and set the filter to verbose.
