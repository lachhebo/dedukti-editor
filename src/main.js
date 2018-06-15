"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };

const dk = require("./dedukti-editor-view");
const URL = require("url");
const child_process = require("child_process");
const { AutoLanguageClient, DownloadFile } = require("atom-languageclient");

class DeduktiLanguageClient extends AutoLanguageClient {
  constructor() {
    // at the opening of Atom
    super();

    atom.config.set("core.debugLSP", true); // Debug by default;
    this.config = require("./config.json"); // To modify the configuration, check the setting view

  }

  addeventbutton() {
    // add some listener for buttons
    document.getElementById("first").addEventListener("click", () => {
      module.exports.command1();
    });
    document.getElementById("second").addEventListener("click", () => {
      module.exports.command2();
    });
    document.getElementById("third").addEventListener("click", () => {
      module.exports.command3();
    });
  }

  add_event_cursor(editor, editor_list) {
    // add some listener for cursor in an editor
    // we ckeck the editor is currenctly not listened
    if (!editor_list.includes(editor)) {
      this._disposable.add(
        editor.onDidChangeCursorPosition(cursor => {
          //module.exports.deduktiEditorView.updateView(cursor);
        })
      );
      editor_list.push(editor);
    }
  }

  startServer(projectPath) {
    // we want the server to listen for every .dk file on home directory
    const homedir = require("os").homedir();
    return super.startServer(homedir);
  }

  activate() {
    super.activate();

    Object.getPrototypeOf(this._serverManager).getServer = function getServer(
      textEditor,
      { shouldStart } = { shouldStart: false }
    ) {
      return __awaiter(this, void 0, void 0, function*() {
        const finalProjectPath = textEditor.getPath();
        if (finalProjectPath == null) {
          // Files not yet saved have no path
          return null;
        }
        const foundActiveServer = this._activeServers.find(
          s => finalProjectPath === s.projectPath
        );
        if (foundActiveServer) {
          return foundActiveServer;
        }
        const startingPromise = this._startingServerPromises.get(
          finalProjectPath
        );
        if (startingPromise) {
          return startingPromise;
        }
        return shouldStart && this._startForEditor(textEditor)
          ? yield this.startServer(finalProjectPath)
          : null;
      });
    }.bind(this._serverManager);

    // create the view and variables we will need to handle it.
    this.deduktiEditorView = new dk.default();
    this.editor_list = new Array();
    this.buttons_listened = 0;

    // add some keybindings:
    atom.commands.add("atom-workspace", {
      "dedukti-editor:command1": () => this.command1()
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:command2": () => this.command2()
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:command3": () => this.command3()
    });

    this.deduktiEditorView.initialise_exemple();

    // manage the view opening and closing, call listener for buttons
    this._disposable.add(
      atom.workspace.observeActiveTextEditor(editor => {
        //for each active editor, check the pane is actually a file (not something like a setting view)
        if (typeof editor != "undefined") {
          let scopeName = editor.getGrammar().scopeName;
          //get the editor file extension and check it's include with the dedukti grammar
          if (this.getGrammarScopes().includes(scopeName)) {
            //open the view and add new listener for cursor and buttons if necessary
            atom.workspace.open(this.deduktiEditorView);
            this.add_event_cursor(editor, this.editor_list);
            if (this.buttons_listened === 0) {
              setTimeout(this.addeventbutton, 1000); // TODO: do not use a setTimeout but rather a reactive function.
              this.buttons_listened = 1;
            }
          }
          else {
            //hide the view
            atom.workspace.hide(this.deduktiEditorView);
          }
        }
        else {
          //hide the view
          atom.workspace.hide(this.deduktiEditorView);
        }
      })
    );

  }

  getGrammarScopes() {
    return ["source.dedukti"];
  }

  getLanguageName() {
    return "Dedukti";
  }

  getServerName() {
    return "lp-lsp";
  }

  uriToPath(uri) { // just a tool we need.
    const url = URL.parse(uri);
    if (url.protocol !== "file:" || url.path === undefined) {
      return uri;
    }
    let filePath = decodeURIComponent(url.path);
    if (process.platform === "win32") {
      // Deal with Windows drive names
      if (filePath[0] === "/") {
        filePath = filePath.substr(1);
      }
      return filePath.replace(/\//g, "\\");
    }
    return filePath;
  }

  colorizebuffer(params) {
    // every variable we need.
    let path = this.uriToPath(params.uri);
    let i = 0;
    let z = 0;
    var mydiagnostics = new Array();
    let text_editors = atom.workspace.getTextEditors(); // we get all active editors in atom
    let editor = "";
    let j = 0;

    //we want to get the editor concerned by the diagnostics
    for (j = 0; j < text_editors.length; j++) {
      let text_editor_path = text_editors[j].getPath();
      if (text_editor_path == path) {
        editor = text_editors[j];
      }
    }

    if (editor === "") {
      //the editor concerned by the diagnostics is not open.
    } else {
      //we destroy previous color markers on this editor
      let marker_color = editor.findMarkers({ persistent: false });
      for (z = 0; z < marker_color.length; z++) {
        marker_color[z].destroy();
      }
    }
    // Then we put new color markers on this editor
    for (i = 0; i < params.diagnostics.length; i++) {
      if (params.diagnostics[i].message === "OK") {
        // Hence Green
        var marker = editor.markScreenRange([
          [
            params.diagnostics[i].range.start.line,
            params.diagnostics[i].range.start.character
          ],
          [
            params.diagnostics[i].range.end.line,
            params.diagnostics[i].range.end.character
          ]
        ]);
        marker.setProperties({ persistent: false, invalidate: "touch" }); //The color is diseappearing when 'touch'
        let decoration = editor.decorateMarker(marker, {
          type: "text",
          class: "Completed_lines"
        });
      } else {
        // Hence, in red
        var marker = editor.markScreenRange([
          [
            params.diagnostics[i].range.start.line,
            params.diagnostics[i].range.start.character
          ],
          [
            params.diagnostics[i].range.end.line,
            params.diagnostics[i].range.end.character
          ]
        ]);
        marker.setProperties({ persistent: false, invalidate: "touch" }); //The color disappears when 'touch'
        let decoration = editor.decorateMarker(marker, {
          type: "text",
          class: "Failed_line"
        });
        // we want those message to be displayed on the diagnostics panel.
        mydiagnostics.push(params.diagnostics[i]);
      }
    }
    // we return errors message to be displayed on the diagnostics panel.
    return mydiagnostics;
  }

  preInitialization(connection) {
    // we hack onPublishDiagnostics message before it is received by atom and handle positive message
    connection.onPublishDiagnostics = function(callback) {
      let mycallback = function(params) {
        let mydiagnostics = this.colorizebuffer(params);
        params.diagnostics = mydiagnostics;
        callback(params);
      };
      connection._onNotification(
        { method: "textDocument/publishDiagnostics" },
        mycallback.bind(module.exports)
      );
    };

    this.connect_server = connection;

    /*
    A new command we may add to handle the view.
    connection.onCustom("ProofAssistant/ActiveGoals",
    (e) => {
      this.updateView(e);
    });
    */
  }

  startServerProcess(projectPath) {
    // we get the command and args from the setting panel
    var command = atom.config.get("dedukti-editor.DeduktiSettings.lspServerPath");
    var args = atom.config.get("dedukti-editor.DeduktiSettings.lspServerArgs");

    /* // Debug for developper (isma)
    var command_test = "./lplsp_test";
    const childProcess = child_process.spawn(command_test, args,{
      cwd: "/home/isma/Documents/dedukti-editor/src"
    });
     // */

    // a new process is created and send back
    const childProcess = child_process.spawn(command, args);
    return childProcess;
  }

  handleSpawnFailure(err) {
    //TODO: Use the `which` module to provide a better error in the case of a missing server.
    atom.notifications.addError(
      "Error starting the language server: " +
        atom.config.get("dedukti-editor.DeduktiSettings.lspServerPath"),
      {
        dismissable: true,
        description:
          "Please make sure you've followed the Installation section in the README and that the server is functional"
      }
    );
  }

  apply_check_file(e) {} //The first command launch this function

  updateView(e) {
    //Depreceated
    //a function to update a part of the view (seems useless for the moment)
    this.deduktiEditorView.updateSubProof(e);
  }

  //In case the a key binding or a button is activated, we send message to the server
  command1() {
    this.connect_server.sendCustomNotification(
      "ProofAssistant/CapturedKey1",
      []
    );
  }
  command2() {
    this.connect_server.sendCustomNotification(
      "ProofAssistant/CapturedKey2",
      []
    );
  }
  command3() {
    this.connect_server.sendCustomNotification(
      "ProofAssistant/CapturedKey3",
      []
    );
  }
}

module.exports = new DeduktiLanguageClient();
