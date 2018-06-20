"use strict";

const dk = require("./dedukti-editor-view");
const URL = require("url");
const child_process = require("child_process");
const { AutoLanguageClient, DownloadFile, Convert } = require("atom-languageclient");

class DeduktiLanguageClient extends AutoLanguageClient {
  constructor() {
    // at the opening of Atom
    super();

    //atom.config.set("core.debugLSP", true); // Debug by default;
    this.config = require("./config.json"); // To modify the configuration, check the setting view
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

  activate() {
    super.activate();

    // We want the server to be launched if a .dk file is opened on the home directory

    Object.getPrototypeOf(
      this._serverManager
    ).determineProjectPath = function determineProjectPath(textEditor) {
      const filePath = textEditor.getPath();
      if (filePath == null) {
        return null;
      }
      return filePath;
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
    atom.commands.add("atom-workspace", {
      "dedukti-editor:next": () => this.deduktiEditorView.nextFocus()
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:last": () => this.deduktiEditorView.lastFocus()
    });
    //"ctrl-alt-p": "dedukti-editor:next"

    //this.deduktiEditorView.initialise_exemple();

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
              this.addeventbutton();
              this.buttons_listened = 1;
            }
          } else {
            //hide the view
            atom.workspace.hide(this.deduktiEditorView);
          }
        } else {
          //hide the view
          atom.workspace.hide(this.deduktiEditorView);
        }
      })
    );
  }

  startServer(projectPath) {
    // we want the server to listen for every .dk file on home directory
    const homedir = require("os").homedir();
    return super.startServer(homedir);
  }

  preInitialization(connection) {
    // we hack onPublishDiagnostics message before it is received by atom and handle positive message
    connection.onPublishDiagnostics = function(callback) {
      let mycallback = function(params) {
        params.diagnostics = this.deduktiEditorView.updateDiagnostics(params.diagnostics, Convert.uriToPath(params.uri));
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

  colorizebuffer(params) {
    // every variable we need.
    let path = Convert.uriToPath(params.uri);
    let i = 0;
    let z = 0;
    let j = 0;
    var mydiagnostics = new Array();
    let text_editors = atom.workspace.getTextEditors(); // we get all active editors in atom
    let editor = "";

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

  add_event_cursor(editor, editor_list) {
    // add some listener for cursor in an editor
    // we ckeck the editor is currently not listened
    if (!editor_list.includes(editor)) {
      this._disposable.add(
        editor.onDidChangeSelectionRange(selection => {
          module.exports.deduktiEditorView.updateView(selection, editor);
        })
      );
      editor_list.push(editor);
    }
  }

  addeventbutton() {
    // add some listener for buttons
    this.deduktiEditorView.but1.addEventListener("click", () => {
      module.exports.command1();
    });

    this.deduktiEditorView.but2.addEventListener("click", () => {
      module.exports.command2();
    });

    this.deduktiEditorView.but3.addEventListener("click", () => {
      module.exports.command3();
    });

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

  updateView(e) {
    //Depreceated
    //a function to update a part of the view (seems useless for the moment)
    this.deduktiEditorView.updateSubProof(e);
  }

}

module.exports = new DeduktiLanguageClient();
