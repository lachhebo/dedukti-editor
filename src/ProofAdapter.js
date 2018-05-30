"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("../node_modules/atom-languageclient/build/lib/convert");
const languageclient_1 = require("../node_modules/atom-languageclient/build/lib/languageclient");
// Public: Listen to diagnostics messages from the language server and publish them
// to the user by way of the Linter Push (Indie) v2 API supported by Atom IDE UI.
class LinterPushV2Adapter {
    // Public: Create a new {LinterPushV2Adapter} that will listen for diagnostics
    // via the supplied {LanguageClientConnection}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide diagnostics.
    constructor(connection) {
      console.log("connected finaly");
        this._diagnosticMap = new Map();
        this._diagnosticCodes = new Map();
        this._indies = new Set();
        this.marker_color = new Array();
        console.log(this.marker_color);
        connection.onPublishDiagnostics(this.captureDiagnostics.bind(this));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this.detachAll();
    }
    // Public: Attach this {LinterPushV2Adapter} to a given {V2IndieDelegate} registry.
    //
    // * `indie` A {V2IndieDelegate} that wants to receive messages.
    attach(indie) {
        this._indies.add(indie);
        this._diagnosticMap.forEach((value, key) => indie.setMessages(key, value));
        indie.onDidDestroy(() => {
            this._indies.delete(indie);
        });
    }
    // Public: Remove all {V2IndieDelegate} registries attached to this adapter and clear them.
    detachAll() {
        this._indies.forEach((i) => i.clearMessages());
        this._indies.clear();
    }
    // Public: Capture the diagnostics sent from a langguage server, convert them to the
    // Linter V2 format and forward them on to any attached {V2IndieDelegate}s.
    //
    // * `params` The {PublishDiagnosticsParams} received from the language server that should
    //            be captured and forwarded on to any attached {V2IndieDelegate}s.




    captureDiagnostics(params) {
        const path = convert_1.default.uriToPath(params.uri);
        const codeMap = new Map();
        const messages = params.diagnostics.map((d) => {
            const linterMessage = this.diagnosticToV2Message(path, d);
            codeMap.set(getCodeKey(linterMessage.location.position, d.message), d.code);
            return linterMessage;
        });

        let z = 0;
        for(z= 0; z<this.marker_color.length;z++){
          this.marker_color[z].destroy();
        }
        console.log("messages : ", messages);

        //On récupère le bon éditeur :
        let text_editors = atom.workspace.getTextEditors();

        let editor;
        let j;
        for(j=0;j<text_editors.length;j++){
          let text_editor_path = text_editors[j].getPath();
          console.log(text_editor_path);
          if(text_editor_path == path ){
            editor = text_editors[j];
          }
        }

        console.log(editor);
        // On met les couleurs :
        let messages_bis = [];
        let i=0;
        for(i=0;i<messages.length;i++){
          if(messages[i].excerpt === "OK"){
            //messages_bis.push(messages[i]);
            // On colorie en vert

            var marker = editor.markScreenRange(
              [ [
                  messages[i].location.position.start.row,
                  messages[i].location.position.start.column
                ],
                [
                  messages[i].location.position.end.row,
                  messages[i].location.position.end.column
                ]
              ]
            );
            //console.log("messages_bis:", messages_bis);
            marker.setProperties({persistent:false, invalidate:'touch'}); //The color is diseappearing when 'touch'
            let decoration = editor.decorateMarker(marker, {type: 'text', class:'Completed_lines'});

            this.marker_color.push(marker);

          }
          else {
            // On colorie en rouge
            messages_bis.push(messages[i]);

            var marker = editor.markScreenRange(
              [ [
                  messages[i].location.position.start.row,
                  messages[i].location.position.start.column
                ],
                [
                  messages[i].location.position.end.row,
                  messages[i].location.position.end.column
                ]
              ]
            );
            //console.log("messages_bis:", messages_bis);
            marker.setProperties({persistent:false, invalidate:'touch'}); //The color is diseappearing when 'touch'
            let decoration = editor.decorateMarker(marker, {type: 'text', class:'Failed_line'});
            this.marker_color.push(marker);
          }
        }
        console.log(i);

        this._diagnosticMap.set(path, messages_bis);
        this._diagnosticCodes.set(path, codeMap);
        this._indies.forEach((i) => i.setMessages(path, messages_bis));
    }
    // Public: Convert a single {Diagnostic} received from a language server into a single
    // {V2Message} expected by the Linter V2 API.
    //
    // * `path` A string representing the path of the file the diagnostic belongs to.
    // * `diagnostics` A {Diagnostic} object received from the language server.
    //
    // Returns a {V2Message} equivalent to the {Diagnostic} object supplied by the language server.
    diagnosticToV2Message(path, diagnostic) {
        return {
            location: {
                file: path,
                position: convert_1.default.lsRangeToAtomRange(diagnostic.range),
            },
            excerpt: diagnostic.message,
            linterName: diagnostic.source,
            severity: LinterPushV2Adapter.diagnosticSeverityToSeverity(diagnostic.severity || -1),
        };
    }
    // Public: Convert a diagnostic severity number obtained from the language server into
    // the textual equivalent for a Linter {V2Message}.
    //
    // * `severity` A number representing the severity of the diagnostic.
    //
    // Returns a string of 'error', 'warning' or 'info' depending on the severity.
    static diagnosticSeverityToSeverity(severity) {
        switch (severity) {
            case languageclient_1.DiagnosticSeverity.Error:
                return 'error';
            case languageclient_1.DiagnosticSeverity.Warning:
                return 'warning';
            case languageclient_1.DiagnosticSeverity.Information:
            case languageclient_1.DiagnosticSeverity.Hint:
            default:
                return 'info';
        }
    }
    // Private: Get the recorded diagnostic code for a range/message.
    // Diagnostic codes are tricky because there's no suitable place in the Linter API for them.
    // For now, we'll record the original code for each range/message combination and retrieve it
    // when needed (e.g. for passing back into code actions)
    getDiagnosticCode(editor, range, text) {
        const path = editor.getPath();
        if (path != null) {
            const diagnosticCodes = this._diagnosticCodes.get(path);
            if (diagnosticCodes != null) {
                return diagnosticCodes.get(getCodeKey(range, text)) || null;
            }
        }
        return null;
    }
}
exports.default = LinterPushV2Adapter;
function getCodeKey(range, text) {
    return [].concat(...range.serialize(), text).join(',');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGludGVyLXB1c2gtdjItYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9saW50ZXItcHVzaC12Mi1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsd0NBQWlDO0FBQ2pDLHNEQU0yQjtBQUUzQixtRkFBbUY7QUFDbkYsaUZBQWlGO0FBQ2pGO0lBS0UsOEVBQThFO0lBQzlFLCtDQUErQztJQUMvQyxFQUFFO0lBQ0Ysb0dBQW9HO0lBQ3BHLFlBQVksVUFBb0M7UUFSeEMsbUJBQWMsR0FBa0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMxRCxxQkFBZ0IsR0FBb0QsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUM5RSxZQUFPLEdBQThCLElBQUksR0FBRyxFQUFFLENBQUM7UUFPckQsVUFBVSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsNkVBQTZFO0lBQ3RFLE9BQU87UUFDWixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELG1GQUFtRjtJQUNuRixFQUFFO0lBQ0YsZ0VBQWdFO0lBQ3pELE1BQU0sQ0FBQyxLQUEyQjtRQUN2QyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDM0UsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUU7WUFDdEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMkZBQTJG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QUM7UUFDOUIsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4RCxFQUFFLENBQUMsQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztZQUM5RCxDQUFDO1FBQ0gsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUF6R0Qsc0NBeUdDO0FBRUQsb0JBQW9CLEtBQWlCLEVBQUUsSUFBWTtJQUNqRCxNQUFNLENBQUUsRUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxpbnRlciBmcm9tICdhdG9tL2xpbnRlcic7XHJcbmltcG9ydCAqIGFzIGF0b20gZnJvbSAnYXRvbSc7XHJcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xyXG5pbXBvcnQge1xyXG4gIERpYWdub3N0aWMsXHJcbiAgRGlhZ25vc3RpY0NvZGUsXHJcbiAgRGlhZ25vc3RpY1NldmVyaXR5LFxyXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICBQdWJsaXNoRGlhZ25vc3RpY3NQYXJhbXMsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5cclxuLy8gUHVibGljOiBMaXN0ZW4gdG8gZGlhZ25vc3RpY3MgbWVzc2FnZXMgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGFuZCBwdWJsaXNoIHRoZW1cclxuLy8gdG8gdGhlIHVzZXIgYnkgd2F5IG9mIHRoZSBMaW50ZXIgUHVzaCAoSW5kaWUpIHYyIEFQSSBzdXBwb3J0ZWQgYnkgQXRvbSBJREUgVUkuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbnRlclB1c2hWMkFkYXB0ZXIge1xyXG4gIHByaXZhdGUgX2RpYWdub3N0aWNNYXA6IE1hcDxzdHJpbmcsIGxpbnRlci5NZXNzYWdlW10+ID0gbmV3IE1hcCgpO1xyXG4gIHByaXZhdGUgX2RpYWdub3N0aWNDb2RlczogTWFwPHN0cmluZywgTWFwPHN0cmluZywgRGlhZ25vc3RpY0NvZGUgfCBudWxsPj4gPSBuZXcgTWFwKCk7XHJcbiAgcHJpdmF0ZSBfaW5kaWVzOiBTZXQ8bGludGVyLkluZGllRGVsZWdhdGU+ID0gbmV3IFNldCgpO1xyXG5cclxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIG5ldyB7TGludGVyUHVzaFYyQWRhcHRlcn0gdGhhdCB3aWxsIGxpc3RlbiBmb3IgZGlhZ25vc3RpY3NcclxuICAvLyB2aWEgdGhlIHN1cHBsaWVkIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259LlxyXG4gIC8vXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBwcm92aWRlIGRpYWdub3N0aWNzLlxyXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbikge1xyXG4gICAgY29ubmVjdGlvbi5vblB1Ymxpc2hEaWFnbm9zdGljcyh0aGlzLmNhcHR1cmVEaWFnbm9zdGljcy5iaW5kKHRoaXMpKTtcclxuICB9XHJcblxyXG4gIC8vIERpc3Bvc2UgdGhpcyBhZGFwdGVyIGVuc3VyaW5nIGFueSByZXNvdXJjZXMgYXJlIGZyZWVkIGFuZCBldmVudHMgdW5ob29rZWQuXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRldGFjaEFsbCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBBdHRhY2ggdGhpcyB7TGludGVyUHVzaFYyQWRhcHRlcn0gdG8gYSBnaXZlbiB7VjJJbmRpZURlbGVnYXRlfSByZWdpc3RyeS5cclxuICAvL1xyXG4gIC8vICogYGluZGllYCBBIHtWMkluZGllRGVsZWdhdGV9IHRoYXQgd2FudHMgdG8gcmVjZWl2ZSBtZXNzYWdlcy5cclxuICBwdWJsaWMgYXR0YWNoKGluZGllOiBsaW50ZXIuSW5kaWVEZWxlZ2F0ZSk6IHZvaWQge1xyXG4gICAgdGhpcy5faW5kaWVzLmFkZChpbmRpZSk7XHJcbiAgICB0aGlzLl9kaWFnbm9zdGljTWFwLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IGluZGllLnNldE1lc3NhZ2VzKGtleSwgdmFsdWUpKTtcclxuICAgIGluZGllLm9uRGlkRGVzdHJveSgoKSA9PiB7XHJcbiAgICAgIHRoaXMuX2luZGllcy5kZWxldGUoaW5kaWUpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFJlbW92ZSBhbGwge1YySW5kaWVEZWxlZ2F0ZX0gcmVnaXN0cmllcyBhdHRhY2hlZCB0byB0aGlzIGFkYXB0ZXIgYW5kIGNsZWFyIHRoZW0uXHJcbiAgcHVibGljIGRldGFjaEFsbCgpOiB2b2lkIHtcclxuICAgIHRoaXMuX2luZGllcy5mb3JFYWNoKChpKSA9PiBpLmNsZWFyTWVzc2FnZXMoKSk7XHJcbiAgICB0aGlzLl9pbmRpZXMuY2xlYXIoKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ2FwdHVyZSB0aGUgZGlhZ25vc3RpY3Mgc2VudCBmcm9tIGEgbGFuZ2d1YWdlIHNlcnZlciwgY29udmVydCB0aGVtIHRvIHRoZVxyXG4gIC8vIExpbnRlciBWMiBmb3JtYXQgYW5kIGZvcndhcmQgdGhlbSBvbiB0byBhbnkgYXR0YWNoZWQge1YySW5kaWVEZWxlZ2F0ZX1zLlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1B1Ymxpc2hEaWFnbm9zdGljc1BhcmFtc30gcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgc2hvdWxkXHJcbiAgLy8gICAgICAgICAgICBiZSBjYXB0dXJlZCBhbmQgZm9yd2FyZGVkIG9uIHRvIGFueSBhdHRhY2hlZCB7VjJJbmRpZURlbGVnYXRlfXMuXHJcbiAgcHVibGljIGNhcHR1cmVEaWFnbm9zdGljcyhwYXJhbXM6IFB1Ymxpc2hEaWFnbm9zdGljc1BhcmFtcyk6IHZvaWQge1xyXG4gICAgY29uc3QgcGF0aCA9IENvbnZlcnQudXJpVG9QYXRoKHBhcmFtcy51cmkpO1xyXG4gICAgY29uc3QgY29kZU1hcCA9IG5ldyBNYXAoKTtcclxuICAgIGNvbnN0IG1lc3NhZ2VzID0gcGFyYW1zLmRpYWdub3N0aWNzLm1hcCgoZCkgPT4ge1xyXG4gICAgICBjb25zdCBsaW50ZXJNZXNzYWdlID0gdGhpcy5kaWFnbm9zdGljVG9WMk1lc3NhZ2UocGF0aCwgZCk7XHJcbiAgICAgIGNvZGVNYXAuc2V0KGdldENvZGVLZXkobGludGVyTWVzc2FnZS5sb2NhdGlvbi5wb3NpdGlvbiwgZC5tZXNzYWdlKSwgZC5jb2RlKTtcclxuICAgICAgcmV0dXJuIGxpbnRlck1lc3NhZ2U7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuX2RpYWdub3N0aWNNYXAuc2V0KHBhdGgsIG1lc3NhZ2VzKTtcclxuICAgIHRoaXMuX2RpYWdub3N0aWNDb2Rlcy5zZXQocGF0aCwgY29kZU1hcCk7XHJcbiAgICB0aGlzLl9pbmRpZXMuZm9yRWFjaCgoaSkgPT4gaS5zZXRNZXNzYWdlcyhwYXRoLCBtZXNzYWdlcykpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgc2luZ2xlIHtEaWFnbm9zdGljfSByZWNlaXZlZCBmcm9tIGEgbGFuZ3VhZ2Ugc2VydmVyIGludG8gYSBzaW5nbGVcclxuICAvLyB7VjJNZXNzYWdlfSBleHBlY3RlZCBieSB0aGUgTGludGVyIFYyIEFQSS5cclxuICAvL1xyXG4gIC8vICogYHBhdGhgIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcGF0aCBvZiB0aGUgZmlsZSB0aGUgZGlhZ25vc3RpYyBiZWxvbmdzIHRvLlxyXG4gIC8vICogYGRpYWdub3N0aWNzYCBBIHtEaWFnbm9zdGljfSBvYmplY3QgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHtWMk1lc3NhZ2V9IGVxdWl2YWxlbnQgdG8gdGhlIHtEaWFnbm9zdGljfSBvYmplY3Qgc3VwcGxpZWQgYnkgdGhlIGxhbmd1YWdlIHNlcnZlci5cclxuICBwdWJsaWMgZGlhZ25vc3RpY1RvVjJNZXNzYWdlKHBhdGg6IHN0cmluZywgZGlhZ25vc3RpYzogRGlhZ25vc3RpYyk6IGxpbnRlci5NZXNzYWdlIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGxvY2F0aW9uOiB7XHJcbiAgICAgICAgZmlsZTogcGF0aCxcclxuICAgICAgICBwb3NpdGlvbjogQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UoZGlhZ25vc3RpYy5yYW5nZSksXHJcbiAgICAgIH0sXHJcbiAgICAgIGV4Y2VycHQ6IGRpYWdub3N0aWMubWVzc2FnZSxcclxuICAgICAgbGludGVyTmFtZTogZGlhZ25vc3RpYy5zb3VyY2UsXHJcbiAgICAgIHNldmVyaXR5OiBMaW50ZXJQdXNoVjJBZGFwdGVyLmRpYWdub3N0aWNTZXZlcml0eVRvU2V2ZXJpdHkoZGlhZ25vc3RpYy5zZXZlcml0eSB8fCAtMSksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgZGlhZ25vc3RpYyBzZXZlcml0eSBudW1iZXIgb2J0YWluZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGludG9cclxuICAvLyB0aGUgdGV4dHVhbCBlcXVpdmFsZW50IGZvciBhIExpbnRlciB7VjJNZXNzYWdlfS5cclxuICAvL1xyXG4gIC8vICogYHNldmVyaXR5YCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHNldmVyaXR5IG9mIHRoZSBkaWFnbm9zdGljLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHN0cmluZyBvZiAnZXJyb3InLCAnd2FybmluZycgb3IgJ2luZm8nIGRlcGVuZGluZyBvbiB0aGUgc2V2ZXJpdHkuXHJcbiAgcHVibGljIHN0YXRpYyBkaWFnbm9zdGljU2V2ZXJpdHlUb1NldmVyaXR5KHNldmVyaXR5OiBudW1iZXIpOiAnZXJyb3InIHwgJ3dhcm5pbmcnIHwgJ2luZm8nIHtcclxuICAgIHN3aXRjaCAoc2V2ZXJpdHkpIHtcclxuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3I6XHJcbiAgICAgICAgcmV0dXJuICdlcnJvcic7XHJcbiAgICAgIGNhc2UgRGlhZ25vc3RpY1NldmVyaXR5Lldhcm5pbmc6XHJcbiAgICAgICAgcmV0dXJuICd3YXJuaW5nJztcclxuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuSW5mb3JtYXRpb246XHJcbiAgICAgIGNhc2UgRGlhZ25vc3RpY1NldmVyaXR5LkhpbnQ6XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuICdpbmZvJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFByaXZhdGU6IEdldCB0aGUgcmVjb3JkZWQgZGlhZ25vc3RpYyBjb2RlIGZvciBhIHJhbmdlL21lc3NhZ2UuXHJcbiAgLy8gRGlhZ25vc3RpYyBjb2RlcyBhcmUgdHJpY2t5IGJlY2F1c2UgdGhlcmUncyBubyBzdWl0YWJsZSBwbGFjZSBpbiB0aGUgTGludGVyIEFQSSBmb3IgdGhlbS5cclxuICAvLyBGb3Igbm93LCB3ZSdsbCByZWNvcmQgdGhlIG9yaWdpbmFsIGNvZGUgZm9yIGVhY2ggcmFuZ2UvbWVzc2FnZSBjb21iaW5hdGlvbiBhbmQgcmV0cmlldmUgaXRcclxuICAvLyB3aGVuIG5lZWRlZCAoZS5nLiBmb3IgcGFzc2luZyBiYWNrIGludG8gY29kZSBhY3Rpb25zKVxyXG4gIHB1YmxpYyBnZXREaWFnbm9zdGljQ29kZShlZGl0b3I6IGF0b20uVGV4dEVkaXRvciwgcmFuZ2U6IGF0b20uUmFuZ2UsIHRleHQ6IHN0cmluZyk6IERpYWdub3N0aWNDb2RlIHwgbnVsbCB7XHJcbiAgICBjb25zdCBwYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcclxuICAgIGlmIChwYXRoICE9IG51bGwpIHtcclxuICAgICAgY29uc3QgZGlhZ25vc3RpY0NvZGVzID0gdGhpcy5fZGlhZ25vc3RpY0NvZGVzLmdldChwYXRoKTtcclxuICAgICAgaWYgKGRpYWdub3N0aWNDb2RlcyAhPSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpYWdub3N0aWNDb2Rlcy5nZXQoZ2V0Q29kZUtleShyYW5nZSwgdGV4dCkpIHx8IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q29kZUtleShyYW5nZTogYXRvbS5SYW5nZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gKFtdIGFzIGFueVtdKS5jb25jYXQoLi4ucmFuZ2Uuc2VyaWFsaXplKCksIHRleHQpLmpvaW4oJywnKTtcclxufVxyXG4iXX0=
