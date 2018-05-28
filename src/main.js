const dk = require("./dedukti-editor-view");
const os = require("os");
const ChildProcess = require("child_process");
const Path = require("path");
const fs = require("fs");
const {AutoLanguageClient} = require("atom-languageclient");
//const convert_uri = require("./convert.js");

/* I think the extension should automaticallt install the right server
const serverDownloadUrl =
"http://download.eclipse.org/jdtls/milestones/0.14.0/jdt-language-server-0.14.0-201802282111.tar.gz"
const serverDownloadSize = 35873467
const bytesToMegabytes = 1024 * 1024
*/

class DeduktiLanguageClient extends AutoLanguageClient {

  constructor () {
    super();
    atom.config.set("core.debugLSP", true);
    ////console.log(atom.workspace.getTextEditors());
    this.config = require("./config.json");
  };

  getGrammarScopes(){
    //console.log("grammarscope");
    if(atom.config.get("dedukti-editor.WhichProover") === "dedukti"){
      return ["source.dedukti"]; // The server is launched for .dk file.
    }
    else if (atom.config.get("dedukti-editor.WhichProover") === "coq") {
      return ["source.coq"];
    }
    else if (atom.config.get("dedukti-editor.WhichProover") === "isabelle") {
      return ["source.isabelle"];
    }

  };

  getLanguageName(){
    //console.log("languagename");
    return  atom.config.get("dedukti-editor.DeduktiSettings.LanguageName");;
  };

  getServerName(){
    //console.log("servername");
    /*
    let result = atom.workspace.getTextEditors();
    let i =0;
    let alpha = "";
    for(i=0;i<result.length;i++){
      alpha = //console.log(result[i].getPath());
      console.log(pathToUri(alpha));
    }
    */
    return  atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer");
  };

  startServerProcess () {
    //console.log("start server");

    //We create and open the view when the server is started
    this.deduktiEditorView = new dk.default(null, null, null, null, null, null, null);
    atom.workspace.open(this.deduktiEditorView);

    // We are creating new key binding :
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command1": () => this.command1()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command2": () => this.command2()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command3": () => this.command3()})

    //this.updateView(" (forall A : Prop, A -> A).");

    // We are creating the data we need;
    var command = "";
    var args = []
    var projectPath = "";

    if(atom.config.get("dedukti-editor.DeduktiSettings.UseMyOwnServer") == false){
      if(atom.config.get("dedukti-editor.WhichProover") === "dedukti"){ // if dedukti server is needed
         command = "./lplsp";
         args = []
         projectPath = this.CheckServerPath();
      }
      else if(atom.config.get("dedukti-editor.WhichProover") === "coq"){ // if coq server is needed
        // To implement
      }
      else if(atom.config.get("dedukti-editor.WhichProover") === "isabelle"){ // if isabelle server is needed
        //To implement
      }
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
    return childProcess;

  };

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
  };

  apply_check_file (e) {
    // To implement
    /*
    Pseudo-code :
      for each ColorSpan
      color the ColorSPan.rangeSpan of the buffer with the color
      of ColorSpan.intColor
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

  /*
  static pathToUri(filePath) {
      let newPath = filePath.replace(/\\/g, "/");
      if (newPath[0] !== "/") {
          newPath = `/${newPath}`;
      }
      return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
  }
  */

  command1(){
    //console.log("the key binding was activated");
    //send a custom Notification
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
      throw 'need to install the server';
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
