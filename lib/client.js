/*
In the future, we want to use a module to handle communication with the server to
ahev a cleaner and easier maintanable code.
*/

function client() {

  this.hello = function() {
    return 'hello!';
  }

  this.goodbye = function() {
    return 'goodbye!';
  }
}

// ERR: I can't include this module yet (nedd more research)
module.exports = client;
