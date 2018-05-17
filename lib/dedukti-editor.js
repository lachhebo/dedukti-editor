'use babel';

import DeduktiEditorView from './dedukti-editor-view';
import { CompositeDisposable } from 'atom';
import { File } from 'atom';

// We need to use terminal command, so we require this package.
const cmd=require('node-cmd');
var JSONParse = require('json-parse-safe');

//We are creating the process were going to use to handle the server
var processRef=cmd.get(
  `cd $ATOM_HOME/packages/dedukti-editor/resources
  ./lptop.native`
);

// A global variable used to store the emplacement of the dedukti program (not used yet)
var dedukti_place;
var last_checkpoint; // ( a checkpoint variable to used diff)

//A panel of variable needed for checking
var array_json_parsed = new Array();
var array_json_marker = new Array();
var stop_cancelled = 0;
var semi_stop_cancelled = 0;
var cancelled_where;
//var myview = 0;

export default {

  deduktiEditorView: null,
  modalPanel: null,
  subscriptions: null,


  activate(state) {
   this.deduktiEditorView = new DeduktiEditorView(state.deduktiEditorViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.deduktiEditorView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable(
      atom.workspace.addOpener(uri => {
          if (uri == 'atom://dedukti-editor'){
            return new DeduktiEditorView(); // We are creating and showing the Information Panel
          }
      })
    );

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'dedukti-editor:toggle': () => this.toggle()
    }));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:check', function check(){

        let editor
        if (editor = atom.workspace.getActiveTextEditor()){

          //We need to write inside the json file what we want to transit :
          var text = editor.getText();
          var last_checkpoint = editor.createCheckpoint(); //We have created a checkpoint to handle automodification

          let markers = editor.findMarkers(); //We are getting all markers ...
          for (i=0;i<markers.length;i++){ // ... and whe destroy them.
            markers[i].destroy();
          }
          //Were cleaning the array needed for parsing and checking
          array_json_parsed = [];
          array_json_marker = [];
          stop_cancelled = 0;
          semi_stop_cancelled = 0;

          var sending = '[ "1", [ "Send", "'+text+'"]]';

          processRef.stdin.write(sending); // I parse the code
          console.log("text sent for parsing");

          processRef.stdin.write('\n ["2", ["Check", 0]]'); // Then I check it
          //console.log("checking command sent");
          //console.log(processRef.stdout.read());
        }
      }
    ));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:erase', function erase(){
        let editor
        if (editor = atom.workspace.getActiveTextEditor()){

          let markers = editor.findMarkers();

          for (i=0;i<markers.length;i++){ //We are erasing all colors defined.
            markers[i].destroy();
          }
        }
      }
    ));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:next_line', function next_line(){ //Not defined yet
        let editor
        if (editor = atom.workspace.getActiveTextEditor()){

      }
    }
    ));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:previous_line', function previous_line(){ //Not defined yet
        let editor
        if (editor = atom.workspace.getActiveTextEditor()){

        }
      }
    ));


  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.deduktiEditorView.destroy();
  },

/*
  serialize() {
    return {
      deduktiEditorViewState: this.deduktiEditorView.serialize()
    };
  },
*/

  toggle() {

    atom.workspace.toggle('atom://dedukti-editor');

    let editor
    if (editor = atom.workspace.getActiveTextEditor()){

      editor.onDidStopChanging( function re_send(){

        buffer = editor.getBuffer();
        array_changes = buffer.getChangesSinceCheckpoint(last_checkpoint);
        last_checkpoint = editor.createCheckpoint();

      });

      //console.log(processRef);

      //console.log(processRef.stdout.read());

      processRef.stdout.on('data',
        function(data) { //The callback fonction with the data sent by lptop
          //console.log("response received");
          console.log(data);
          var array_string_json = data.split('\n'); // I split the code to see each line

          var i =0;
          while((i< array_string_json.length-1) && (stop_cancelled === 0)){ // For each line until we found a error in the check

            var obj_json = JSONParse(array_string_json[i]);

            if( obj_json.value == null){
              //console.log(obj_json.value);
              //console.log("yes");
              stop_cancelled = 1;
              cancelled_where = i;
              atom.notifications.addError('Your code can\'t be parsed: ",\' are unauthorized ', { //We send a notification of error
                dismissable: true
              });
            }

            //console.log("response recevied for line" +line);
            if( (stop_cancelled ===0 ) && (obj_json.value[0] === "Feedback")) //If it's a feedback message
            {
              if(obj_json.value[1].event[0] == "Parsed"){ //If it's a parsed confirmation
                array_json_parsed.push(obj_json.value); //We register the data into a array
              }
              else if (obj_json.value[1].event[0] === "Cancelled") { //If an error is detected
                array_json_marker.push(obj_json.value); // We register the object

                var breaking = 0;
                var j=0;
                while((j<array_json_parsed.length) && (breaking === 0)){
                  /*
                  We need to get the position of the line we want to color in red, this position is in
                  one of the array in array_json_parsed
                  */
                  if((array_json_parsed[j][1].span_id == obj_json.value[1].span_id)){
                    breaking = 1;

                    // We get the position and we coloring in red the right range
                    let information = array_json_parsed[j][1].event[1];
                    var marker = editor.markScreenRange(
                      [[information.start_line-1, information.start_col],[information.end_line, information.end_col]]
                    );
                    marker.setProperties({persistent:false, invalidate:'touch'}); //The color is diseappearing when 'touch'
                    decoration = editor.decorateMarker(marker, {type: 'text', class:'Failed_line'});

                    // We make sure nthe next lines are not checked.
                    semi_stop_cancelled = 1;
                    cancelled_where = obj_json.value[1].span_id;
                  }
                  else{
                    j=j+1;
                  }
                }

              }
              else if (obj_json.value[1].event[0] === "Completed") { //Exactely the same thing as with cancelled

                array_json_marker.push(obj_json.value);
                //console.log("complete entry");
                var breaking = 0;
                var j=0;

                while((j<array_json_parsed.length) && (breaking === 0)){
                  //console.log(array_json_parsed[j][1].span_id, obj_json.value[1].span_id);
                  //if(typeof array_json[j][1].span_id == 'undefined'){
                    //console.log(array_json);
                  //}

                  if((array_json_parsed[j][1].span_id == obj_json.value[1].span_id)){
                    breaking = 1;
                    //console.log("completed")
                    let information = array_json_parsed[j][1].event[1];

                    var marker = editor.markScreenRange(
                      [[information.start_line-1, information.start_col],[information.end_line, information.end_col]]
                    );
                    marker.setProperties({persistent:false, invalidate:'touch'}); //The color is diseappearing when 'touch'

                    //array_color_marker.push(marker);
                    decoration = editor.decorateMarker(marker, {type: 'text', class:'Completed_lines'});
                    //cancelled_where = array_json[i][1].span_id+1;
                  }
                  else{
                    j=j+1;
                  }
                }
              }
              else if (obj_json.value[1].event[0] === "Message") {
                /*
                We want to get the message of errors,
                but this message is sent after the Cancelled message, so we created a semi_stop_cancelled
                variable
                */
                if(semi_stop_cancelled === 1){
                  stop_cancelled = 1;
                }
              }
            }
            //console.log("response traited for line" +line);
            //line = line +1;
            i= i+1;
            }

          if(stop_cancelled === 1){ //We are coloring each line after the  errors lines in orange
            k = 0;
            while(k<array_json_parsed.length){ //For each line parsed
                if(array_json_parsed[k][1].span_id > cancelled_where){
                  /*
                  We can suppose that each line of the buffer was parsed because the checking is
                  way more complex that the parsing and because the parsing is generaly handle before.
                  To be more sure, we need to test the programm with a big file.
                  Or we can just create a responsive fonction using a npm-module
                  */

                    let information = array_json_parsed[k][1].event[1];
                    var marker = editor.markScreenRange(
                      [[information.start_line-1, information.start_col],[information.end_line, information.end_col]]
                    );
                    marker.setProperties({persistent:false, invalidate:'touch'}); //The color is diseappearing when 'touch'
                    decoration = editor.decorateMarker(marker, {type: 'text', class:'Cancelled_line'});
                }
                k= k+1;
            }
          }
          //console.log("response treated");
        });

      processRef.stderr.on(
        'data', function(data){
          console.log(data);
          if(data.includes('sertop: internal error')){
            atom.notifications.addError('sertop: internal error', { //We send a notification of error
              detail: data,
              dismissable: true
            });
          }
          else if(data.includes('offset')){
            atom.notifications.addError('Your document does not respect the dedukti synthax', { //same
              detail: data,
              dismissable: true
            });
          }
        }

      )
    }
  }

};
