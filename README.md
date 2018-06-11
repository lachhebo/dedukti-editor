# dedukti-editor

## Installation

You need Atom >= 1.19.

### Atom Dependencies:

Install `atom-ide-ui` from "Install" in Atom's settings or run:
```
$ apm install atom-ide-ui
```

Then you need to clone and install this package:
```
$ git clone https://github.com/lachhebo/dedukti-editor.git
$ cd dedukti-editor
$ apm link
```

### Installing the Dedukti Language Server:

The easiest method is to use the [OPAM](https://opam.ocaml.org/) package manager:
```
$ opam repository add deducteam https://scm.gforge.inria.fr/anonscm/git/opam-deducteam/opam-deducteam.git
$ opam install lambdapi-lsp
```

## Debug :

To debug, open a developper console (Ctrl+Shift+I) and set the filter to verbose.

## ToDo : 

- implement a new command to handle the view.
- work on the view.
