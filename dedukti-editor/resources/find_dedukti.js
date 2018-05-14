var spawn = require('child_process').spawn;
spawn('which', ['pipewire'], { stdio: 'inherit' });
