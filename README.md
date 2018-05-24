# dedukti-editor

## Installation

First, make sure you have Atom 1.19+ installed.

Install atom-ide-ui from "Install" in Atom's settings or run:

```
apm install atom-ide-ui
```

Then you need to clone this package
  - Open a terminal
  - go in the package folder
  - run the command :

```
apm link
```

Finally, you need the lptop.native program :
  - install it on your machine
  - then go to the setting view, on installed packages
  - go to dedukti-editor
  - indicate where your server (lptop) is installed.

## State :

When atom is detecting a file with a .dk extension, he is launching the server, But nothing else
happens.
