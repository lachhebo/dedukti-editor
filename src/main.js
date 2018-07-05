"use strict";

/* Documetation Links

https://developer.mozilla.org/en-US/docs/Web/javascript
https://atom.io/docs/api/v1.28.0/AtomEnvironment
https://github.com/atom/atom-languageclient //Here there is also many examples of atom language extensions

*/

const dk = require("./dedukti-editor-view");
const Utils  = require("./utils").default;
const child_process = require("child_process");
const {
  AutoLanguageClient,
  DownloadFile,
  Convert
} = require("atom-languageclient");


class DeduktiLanguageClient extends AutoLanguageClient {

  constructor() {
    // at the opening of Atom
    super();

    atom.config.set("core.debugLSP", true); // Debug by default;
    this.config = require("./config/settings.json"); // To modify the configuration, check the setting view
  }

  activate() {
    super.activate();
    // create the view and variables we will need to handle the extensions.
    this.deduktiEditorView = new dk.default();
    //Initiaise the tools we will need to add interaction within the editor
    Utils.initialize(this);

  }

  getGrammarScopes() {
    return ["source.dedukti"]; //the grammar we defined in dedukti.cson
  }

  getLanguageName() {
    return "Dedukti";
  }

  getServerName() {
    return "lp-lsp";
  }

  startServerProcess(projectPath) {

    // we get the command and args from the setting panel
    var command = atom.config.get("dedukti-editor.DeduktiSettings.lspServerPath");
    var args = atom.config.get("dedukti-editor.DeduktiSettings.lspServerArgs");

     // Debug for developper (isma)
    /* var command_test = "./lp-lsp_test";
    const childProcess = child_process.spawn(command_test, args,{
    cwd: "/home/isma/"
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

  preInitialization(connection) {

    // we hack onPublishDiagnostics message before it is received by atom and handle positive message
    connection.onPublishDiagnostics = function(callback) {
      if (!module.exports.deduktiEditorView.isInitialized()){ // We check the view has been initialised
        module.exports.deduktiEditorView.initialize();  // If not, we initialize it
      }
      let mycallback = function(params) {
        // we add our function before the diagnostics are processed by atomlanguageclient
        this.deduktiEditorView.updateDiagnostics(
          params.diagnostics,
          Convert.uriToPath(params.uri)
        ); // the update diagnostics function will capture the goals embedded within the diagnostics
        params.diagnostics = Utils.colorBuffer(params); // the colorBuffer function will tcolor in red and green the editor and remove positive diagnostics
        callback(params); // Eventually, the remaining diagnostics are processed by atomlanguageclient
      };
      connection._onNotification(
        { method: "textDocument/publishDiagnostics" },
        mycallback.bind(module.exports) // mycallback need to be execute within this file context  //https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Function/bind
      );
    };

    //TODO WORKAROUND AGAINST ISSUE NUMERO 1

  }

}

module.exports = new DeduktiLanguageClient();
