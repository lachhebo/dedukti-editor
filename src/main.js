const dk = require("./dedukti-editor-view");
const os = require("os");
const ChildProcess = require("child_process");
const Path = require("path");
const fs = require("fs");
const {AutoLanguageClient, DownloadFile} = require("atom-languageclient");
const linter_push_v2_adapter_2 = require("./ProofAdapter");
const linter_push_v2_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/linter-push-v2-adapter");
const apply_edit_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/apply-edit-adapter");
const notifications_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/notifications-adapter");
const document_sync_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/document-sync-adapter");
const logging_console_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/logging-console-adapter");
const signature_help_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/signature-help-adapter");
//const linter_push_v2_adapter_1 = require("./ProofAdapter");
//const convert_uri = require("./convert.js");

/* I think the extension should automaticallt install the right server
const serverDownloadUrl = 'http://download.eclipse.org/jdtls/milestones/0.14.0/jdt-language-server-0.14.0-201802282111.tar.gz'
const serverDownloadSize = 35873467;
const bytesToMegabytes = 1024 * 1024;
*/

class DeduktiLanguageClient extends AutoLanguageClient {

  constructor () {
    super();
    atom.config.set("core.debugLSP", true); // We activate the debug functionnality
    ////console.log(atom.workspace.getTextEditors());
    this.config = require("./config.json");
  };

  getGrammarScopes(){
    //The plan is to use this extension with other PA, not just dedukti.
    return ["source.dedukti"];  // The server is launched for .dk file.
    /*
    if(atom.config.get("dedukti-editor.WhichProover") === "dedukti"){
    }
    else if (atom.config.get("dedukti-editor.WhichProover") === "coq") {
      return ["source.coq"];
    }
    else if (atom.config.get("dedukti-editor.WhichProover") === "isabelle") {
      return ["source.isabelle"];
    }
    */
  };

  getLanguageName(){
    //we choose the language name
    return  atom.config.get("dedukti-editor.DeduktiSettings.LanguageName");;
  };

  getServerName(){
    /*
    let result = atom.workspace.getTextEditors();
    let i =0;
    let alpha = "";
    for(i=0;i<result.length;i++){
      alpha = //console.log(result[i].getPath());
      console.log(pathToUri(alpha));
    }
    */
    //Same here
    return  atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer");
  };

  startServerProcess () {

    //We create and open the view when the server is started
    this.deduktiEditorView = new dk.default(null, null, null, null, null, null, null);
    //atom.workspace.open(this.deduktiEditorView);

    // We are creating new key binding :
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command1": () => this.command1()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command2": () => this.command2()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command3": () => this.command3()})

    // We are creating the data we need;
    var command = "";
    var args = []
    var projectPath = "";

    if(atom.config.get("dedukti-editor.DeduktiSettings.UseMyOwnServer") == false){ //do you use your own server
      if(atom.config.get("dedukti-editor.WhichProover") === "dedukti"){ // if dedukti server is needed
         command = "./lplsp";
         args = []
         projectPath = this.CheckServerPath();
      }
      /*
      else if(atom.config.get("dedukti-editor.WhichProover") === "coq"){ // if coq server is needed
        // To implement
      }
      else if(atom.config.get("dedukti-editor.WhichProover") === "isabelle"){ // if isabelle server is needed
        //To implement
      }
      */
    }
    else{
      projectPath = atom.config.get("dedukti-editor.DeduktiSettings.pathToMyServer");
      command = atom.config.get("dedukti-editor.DeduktiSettings.commandToLaunchIt");
      args = atom.config.get("dedukti-editor.DeduktiSettings.optionnal_arg");
    }

    const childProcess = ChildProcess.spawn(command, args, {
      cwd: projectPath
    }); // The process is launched

    // We are handling errors with this notification
    childProcess.on("error", err =>
      atom.notifications.addError("Unable to start the "+atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer")+" language server.", {
        dismissable: true,
        description:
        "Please make sure you've followed the Installation section in the README"
      })
    );

    super.captureServerErrors(childProcess, projectPath)
    //console.log(childProcess);

    //console.log(this.pathToUri('/home/isma/github/dedukti-editor/resources/test.dk'));

    return childProcess;
    /*
    const startServer = require.resolve('../server_js')
    return super.spawnChildNode([startServer, '--node-ipc'], {
      stdio: [null, null, null, 'ipc']
    })
    */
  };

  startExclusiveAdapters(server) {
      apply_edit_adapter_1.default.attach(server.connection);
      notifications_adapter_1.default.attach(server.connection, this.name, server.projectPath);
      if (document_sync_adapter_1.default.canAdapt(server.capabilities)) {
          server.docSyncAdapter =
              new document_sync_adapter_1.default(server.connection, (editor) => this.shouldSyncForEditor(editor, server.projectPath), server.capabilities.textDocumentSync);
          server.disposable.add(server.docSyncAdapter);
      }
      server.linterPushV2 = new linter_push_v2_adapter_1.default(server.connection);
      server.linterPushV2_Diagnostics = new linter_push_v2_adapter_2.default(server.connection);

      if (this._linterDelegate != null) {
          server.linterPushV2_Diagnostics.attach(this._linterDelegate);
      }
      server.disposable.add(server.linterPushV2);
      server.loggingConsole = new logging_console_adapter_1.default(server.connection);
      if (this._consoleDelegate != null) {
          server.loggingConsole.attach(this._consoleDelegate({ id: this.name, name: 'abc' }));
      }
      server.disposable.add(server.loggingConsole);
      if (signature_help_adapter_1.default.canAdapt(server.capabilities)) {
          server.signatureHelpAdapter = new signature_help_adapter_1.default(server, this.getGrammarScopes());
          if (this._signatureHelpRegistry != null) {
              server.signatureHelpAdapter.attach(this._signatureHelpRegistry);
          }
          server.disposable.add(server.signatureHelpAdapter);
      }
  }


  // Linter push v2 API via LS publishDiagnostics
  consumeLinterV2(registerIndie) {
      this._linterDelegate = registerIndie({ name: this.name });
      if (this._linterDelegate == null) {
          return;
      }
      for (const server of this._serverManager.getActiveServers()) {
          if (server.linterPushV2_Diagnostics != null) {
              server.linterPushV2_Diagnostics.attach(this._linterDelegate);
          }
      }
  }


  preInitialization(connection) { // We add our two new commands
    this.connect_server = connection;
    connection.onCustom("ProofAssistant/Showcheckedfile",
    (e) => {
      this.apply_check_file(e);
    });
    connection.onCustom("ProofAssistant/UpdateView",
    (e) => {
      this.updateView(e);
    });
    /*
    console.log("preInitialization ismael")
    this._diagnosticMap = new Map();
    this._diagnosticCodes = new Map();
    this._indies = new Set();
    connection.onPublishDiagnostics( (e) => {
        this.captureDiagnostics(e);
      });
    */
  };


  apply_check_file (e) {
    // To implement
    /*
    Pseudo-code :
      for each ColorSpan
      color the ColorSPan.rangeSpan of the buffer with the color
      of ColorSpan.intColor
    */
    /*
    Content-Length : number \r\n
    \r\n
    {
    "jsonrpc": "2.0"
    "method": "ProofAssistant/Showcheckedfile",
    "params" :
    {
    uri: DocumentUri
    ColorSpan[]
    }
    }

    ColorSpan =
    {
    Range : array,
    intColor : number
    }

    1 if false
    2 if good
    3 if unchecked
    */


  };

  updateView(e){
    // To implement
    /*
    Pseudo-code :
      for each ColorSpan
      replace the current goal with those added by this
      replace the backgoals with ..
      color in a special color the focusRange
    */
    this.deduktiEditorView.addSubProof(e);
  };

  static pathToUri(filePath) {
      let newPath = filePath.replace(/\\/g, "/");
      if (newPath[0] !== "/") {
          newPath = `/${newPath}`;
      }
      return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
  }

  command1(){
    //console.log("the key binding was activated");
    //send a custom Notification
    //console.log(this._serverManager);
    this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey1",[]);
    //console.log("humm it seems to be launched");
  };

  command2(){
    //console.log("the second key binding was activated");
    //send a custom Notification
    this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey2",[]);
  };

  command3(){
    //console.log("the third key binding was activated");
    //send a custom Notification
    this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey3",[]);
  };

  //atom.workspace.hide(this.deduktiEditorView); // should close the Proof Panel

  CheckServerPath(){ //We are looking where is installed the server
    if(this.isServerInstalled(__dirname)) {
      return __dirname;
    }
    if(this.isServerInstalled(Path.dirname(__dirname))){
      return Path.dirname(__dirname);
    }
    else if(this.isServerInstalled(Path.join(Path.dirname(__dirname),"resources"))){
      return Path.join(Path.dirname(__dirname),"resources");
    }
    else{
      atom.notifications.addError("Unable to find the "+atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer")+" language server.", {
        dismissable: true,
        description:
        "Please make sure the link you've put in the dedukti-editor folder is working (not broken), \n - try to create a new symlink (see README), \n - make sure the symlink is called lplsp"
      })
    }
  };

  isServerInstalled(serverHome) {

    let path_tested = Path.join(serverHome, atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer"));
    return fs.existsSync(path_tested);
  };

  /*
    installServer (serverHome) {
      const localFileName = path.join(serverHome, "download.tar.gz")
      const decompress = require("decompress")
      return this.fileExists(serverHome)
        .then(doesExist => { if (!doesExist) fs.mkdirSync(serverHome) })
        .then(() => DownloadFile(serverDownloadUrl, localFileName, (bytesDone, percent) => this.updateInstallStatus(`downloading ${Math.floor(serverDownloadSize / bytesToMegabytes)} MB (${percent}% done)`), serverDownloadSize))
        .then(() => this.updateInstallStatus("unpacking"))
        .then(() => decompress(localFileName, serverHome))
        .then(() => this.fileExists(path.join(serverHome, serverLauncher)))
        .then(doesExist => { if (!doesExist) throw Error(`Failed to install the ${this.getServerName()} language server`) })
        .then(() => this.updateInstallStatus("installed"))
        .then(() => fs.unlinkSync(localFileName))
    }
  */

}

module.exports = new DeduktiLanguageClient();
