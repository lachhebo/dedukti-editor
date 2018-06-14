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
    /* At the opening of Atom */
    super();

    atom.config.set("core.debugLSP", true); // Debug by default;
    this.config = require("./config.json"); // To modify the configuration, check the setting view
    /*
    //New keybindings:
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command1": () => this.command1()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command2": () => this.command2()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command3": () => this.command3()})
    */
    this.deduktiEditorView = new dk.default(); // We create the view
    this.deduktiEditorView.initialise_exemple();
    this._disposable.add(
      atom.workspace.observeActiveTextEditor(editor => {
        if (typeof editor != "undefined") {
          //In case the pane is not a file (like a setting view)
          let scopeName = editor.getGrammar().scopeName;
          if (this.getGrammarScopes().includes(scopeName)) {
            this._disposable.add(
              editor.onDidChangeCursorPosition(cursor => {
                //this.deduktiEditorView.updateView(cursor);
              })
            );
            atom.workspace.open(this.deduktiEditorView);
          } else {
            atom.workspace.hide(this.deduktiEditorView);
          }
        } else {
          atom.workspace.hide(this.deduktiEditorView);
        }
      })
    );
  }

  startServer(projectPath) {
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

  uriToPath(uri) {
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
    let path = this.uriToPath(params.uri);
    let i = 0;
    let z = 0;
    var mydiagnostics = new Array();
    let text_editors = atom.workspace.getTextEditors(); //We get the good editor
    let editor = "";
    let j = 0;

    for (j = 0; j < text_editors.length; j++) {
      let text_editor_path = text_editors[j].getPath();
      if (text_editor_path == path) {
        editor = text_editors[j];
      }
    }

    if (editor === "") {
      //console.log("l'éditeur n'a pas été trouvé.")
    } else {
      let marker_color = editor.findMarkers({ persistent: false });
      //console.log("les markers :", marker_color);
      for (z = 0; z < marker_color.length; z++) {
        marker_color[z].destroy();
      }
    }
    // Then we put colors on those editors
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
        mydiagnostics.push(params.diagnostics[i]);
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
      }
    }

    return mydiagnostics;
  }

  preInitialization(connection) {
    //Two new commands have been added or modified
    connection.onPublishDiagnostics = function(callback) {
      let mycallback = function(params) {
        //console.log(params.diagnostics);
        let mydiagnostics = this.colorizebuffer(params);
        params.diagnostics = mydiagnostics;
        callback(params);
      };
      connection._onNotification(
        { method: "textDocument/publishDiagnostics" },
        mycallback.bind(module.exports)
      );
    };
    /*
    this.connect_server = connection
    connection.onCustom("ProofAssistant/ActiveGoals",
    (e) => {
      this.updateView(e);
    });
    */
  }

  startServerProcess(projectPath) {
    //await new Promise(resolve => atom.whenShellEnvironmentLoaded(resolve));

    var command = atom.config.get(
      "dedukti-editor.DeduktiSettings.lspServerPath"
    );
    var args = atom.config.get("dedukti-editor.DeduktiSettings.lspServerArgs");

    /* // Debug for developper (isma)
    var command_test = "./lplsp_test";
    const childProcess = child_process.spawn(command_test, args,{
      cwd: "/home/isma/Documents/dedukti-editor/src"
    });
     // */

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
    this.deduktiEditorView.updateSubProof(e);
  } //The second command launch this function

  //In case the first key binding is activated
  //command1(){ this.connect_server.didChangeTextDocument([]); };
  //command2(){ this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey2",[]); };
  //command3(){ this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey3",[]); };
}

module.exports = new DeduktiLanguageClient();
