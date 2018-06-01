# dedukti-editor

## Installation

First, make sure you have Atom 1.19+ installed.

Install atom-ide-ui from "Install" in Atom's settings or run:

```
apm install atom-ide-ui
```

Then you need to clone this package
  - Open a terminal
  - go in the folder where this repository was cloned.
  - run the command :

```
apm link
```

Finally, you need the lplsp program :
  - the installation rules are here : https://github.com/ejgallego/lambdapi/tree/plof/plof

open a terminal on the dedukti-editor folder and run the command :

```
ln -s **Pathtothelambdapifolder**/lambdapi/_build/default/lp-lsp/lp_lsp.exe lplsp

```

## Debug :

To debug, open a developper console (Ctrl+Shift+I) and set the filter to verbose.
