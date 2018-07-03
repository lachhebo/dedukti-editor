# dedukti-editor [![Build Status](https://travis-ci.com/lachhebo/dedukti-editor.svg?branch=master)](https://travis-ci.com/lachhebo/dedukti-editor)

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

- with this version of dedukti-editor, you can check and write your
  proofs.

## Debug :

To debug, open a developper console (Ctrl+Shift+I) and set the filter to verbose.

## TODO :

- implement a new command to handle the view.
- implement goals on the view
- add an action for each button

## Keybindings :

| Key |  Action |
|--|--|
| ctrl-alt-p | Next step |
| ctrl-alt-m | Last step |

### Development instructions

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
