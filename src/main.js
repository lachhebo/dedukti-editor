const dk = require('./dedukti-editor-view');
const ChildProcess = require("child_process");
const Path = require('path')
const {AutoLanguageClient} = require("atom-languageclient");
//const convert_uri = require("./convert.js");

/* I think the extension should automaticallt install the right server
const serverDownloadUrl = 'http://download.eclipse.org/jdtls/milestones/0.14.0/jdt-language-server-0.14.0-201802282111.tar.gz'
const serverDownloadSize = 35873467
const bytesToMegabytes = 1024 * 1024
*/

class DeduktiLanguageClient extends AutoLanguageClient {

  constructor () {
    super()
    atom.config.set('core.debugLSP', true);
    console.log(atom.workspace.getTextEditors());
    this.config = require('./config.json');
  }

  getGrammarScopes(){
    console.log('grammarscope');
    if(atom.config.get('dedukti-editor.WhichProover') === "dedukti"){
      return ['source.dedukti']; // The server is launched for .dk file.
    }
    else if (atom.config.get('dedukti-editor.WhichProover') === "coq") {
      return ['source.coq'];
    }

  }

  getLanguageName(){
    console.log('languagename');
    return  atom.config.get('dedukti-editor.DeduktiSettings.LanguageName');;
  }

  getServerName(){
    console.log('servername');
    /*
    let result = atom.workspace.getTextEditors();
    let i =0;
    let alpha = "";
    for(i=0;i<result.length;i++){
      alpha = console.log(result[i].getPath());
      console.log(pathToUri(alpha));
    }
    */
    return  atom.config.get('dedukti-editor.DeduktiSettings.nameOfServer');
  }

  startServerProcess () {
    console.log("start server");

    //We create and open the view when the server is started
    this.deduktiEditorView = new dk.default(null, null, null, null, null, null, null);
    atom.workspace.open(this.deduktiEditorView);

    // We are creating new key binding :
    atom.commands.add('atom-workspace',
      {'dedukti-editor:command1': () => this.command1()})
    atom.commands.add('atom-workspace',
      {'dedukti-editor:command2': () => this.command2()})
    atom.commands.add('atom-workspace',
      {'dedukti-editor:command3': () => this.command3()})

    //this.updateView(' (forall A : Prop, A -> A).');
    // We are getting the good server we want to launch:

    const command = atom.config.get('dedukti-editor.DeduktiSettings.commandToLaunchIt');
    const args = atom.config.get('dedukti-editor.DeduktiSettings.optionnal_arg');
    const projectPath = atom.config.get('dedukti-editor.DeduktiSettings.pathToMyServer'); //We obtain the path of the location of the server
    const childProcess = ChildProcess.spawn(command, args, {
      cwd: projectPath
    }); // The process is launched

    // We are handling errors with this notification
    childProcess.on("error", err =>
      atom.notifications.addError("Unable to start the "+atom.config.get('dedukti-editor.DeduktiSettings.nameOfServer')+" language server.", {
        dismissable: true,
        description:
        "Please make sure you've followed the Installation section in the README"
      })
    );

    super.captureServerErrors(childProcess, projectPath)
    console.log(childProcess);
    return childProcess;

  }

  preInitialization(connection) { // We add our two new commands
    this.connect_server = connection;
    connection.onCustom('ProofAssistant/Showcheckedfile',
    (e) => {
      this.apply_check_file(e);
    });
    connection.onCustom('ProofAssistant/UpdateView',
    (e) => {
      this.updateView(e);
    });
  }

  apply_check_file (e) {
    // To implement
    /*
    Pseudo-code :
      for each ColorSpan
      color the ColorSPan.rangeSpan of the buffer with the color
      of ColorSpan.intColor
    */
  }

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
  }

  /*
  static pathToUri(filePath) {
      let newPath = filePath.replace(/\\/g, '/');
      if (newPath[0] !== '/') {
          newPath = `/${newPath}`;
      }
      return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
  }
  */

  command1(){
    console.log("the key binding was activated");
    //send a custom Notification
    this.connect_server.sendCustomNotification('ProofAssistant/CapturedKey1',[]);
    console.log("humm it seems to be launched");
  }

  command2(){
    console.log("the second key binding was activated");
    //send a custom Notification
    this.connect_server.sendCustomNotification('ProofAssistant/CapturedKey2',[]);
  }

  command3(){
    console.log("the third key binding was activated");
    //send a custom Notification
    this.connect_server.sendCustomNotification('ProofAssistant/CapturedKey3',[]);
  }

  deactivate() {
    console.log("trying to shutdown the server");
    // We are closing the wiew when the server exit
    atom.workspace.hide(this.deduktiEditorView); // should close the Proof Panel
    return Promise.race([super.deactivate(), this.createTimeoutPromise(2000)]);
  }

  createTimeoutPromise(milliseconds) {
      console.log("shutdown the server");
      return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          clearTimeout(timeout);
          this.logger.error(`Server failed to shutdown in ${milliseconds}ms, forcing termination`);
          resolve();
        }, milliseconds);
    });
  }


  /*
  installServerIfRequired (serverHome) {
    return this.isServerInstalled(serverHome)
      .then(doesExist => { if (!doesExist) return this.installServer(serverHome) })
  }
  */

/*
  isServerInstalled(serverHome) {
    return this.fileExists(path.join(serverHome, atom.config.get('dedukti-editor.DeduktiSettings.nameOfServer')) )
  }
*/

/*

  findServer(){
    var packagePath = Path.join($ATOM_HOME, '.atom','packages','dedukti-editor');
    if(this.fileExists(packagePath, atom.config.get('dedukti-editor.DeduktiSettings.nameOfServer'))){
        return packagePath;
    }
    else if (this.fileExists(packagePath, atom.config.get('dedukti-editor.DeduktiSettings.nameOfServer'))){
      return Path.join(packagePath);
    }



  }
  /*

  
  installServer (serverHome) {
    const localFileName = path.join(serverHome, 'download.tar.gz')
    const decompress = require('decompress')
    return this.fileExists(serverHome)
      .then(doesExist => { if (!doesExist) fs.mkdirSync(serverHome) })
      .then(() => DownloadFile(serverDownloadUrl, localFileName, (bytesDone, percent) => this.updateInstallStatus(`downloading ${Math.floor(serverDownloadSize / bytesToMegabytes)} MB (${percent}% done)`), serverDownloadSize))
      .then(() => this.updateInstallStatus('unpacking'))
      .then(() => decompress(localFileName, serverHome))
      .then(() => this.fileExists(path.join(serverHome, serverLauncher)))
      .then(doesExist => { if (!doesExist) throw Error(`Failed to install the ${this.getServerName()} language server`) })
      .then(() => this.updateInstallStatus('installed'))
      .then(() => fs.unlinkSync(localFileName))
  }
  */
}

module.exports = new DeduktiLanguageClient();
