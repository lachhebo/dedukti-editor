const ChildProcess = require("child_process");
const Path = require('path')
const {AutoLanguageClient} = require("atom-languageclient");

class DeduktiLanguageClient extends AutoLanguageClient {
  // Le package est actif pour les fichiers de types dk
  getGrammarScopes(){
    console.log('grammarscope');
    return ['source.dedukti'];
  }
  getLanguageName(){
    console.log('languagename');
    return 'Dedukti';
  }
  getServerName(){
    console.log('servername');
    return 'lptop';
  }

  startServerProcess () {

   const command = './lptop.native';
   const args = [];

   var projectPath = Path.join(Path.dirname(__dirname), 'resources');

   const childProcess = ChildProcess.spawn(command, args, {
     cwd: projectPath
   });

   childProcess.on("error", err =>
     atom.notifications.addError("Unable to start the Dedukti language server.", {
       dismissable: true,
       description:
         "Please make sure you've followed the INstallation section in the README"
     })
   );

   super.captureServerErrors(childProcess, projectPath)

   console.log(childProcess);

   return childProcess;

  }
}

module.exports = new DeduktiLanguageClient();
