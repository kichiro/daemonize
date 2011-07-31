var daemonize = require("./build/default/daemonize");
var sys = require('sys');
var path = require('path');
var fs = require('fs');
var restart = false;

var argv = require('optimist')
            .usage("Usage: [NODE_ENV=production|development] $0 -p [port_number]")
            .demand(['p'])
            .argv;

var Daemonize = function() {
  this.config = {
    pids_dir: '/var/run',
    pid_base_name: 'my_daemon',
    closeIO: true,
    port: 3000
  }
};

Daemonize.prototype.start = function() {
  try {
    var pid = parseInt(fs.readFileSync(this.config.pids_dir + '/' + this.config.pid_base_name + '_' + this.config.port + '.pid'))
    sys.puts("Daemon already started! (PID: #"+pid+")")
    sys.puts("If you are sure that I'm mistaken, please remove the file "+this.config.pids_dir + '/' + this.config.pid_base_name + '_' + this.config.port + '.pid');
    process.exit(0);
  } catch (e) {}
  
  var pid = daemonize.start(this.config.pids_dir + '/' + this.config.pid_base_name + '_' + this.config.port + '.pid');
  if (pid > 0) {
    sys.puts("Start process with PID #" + pid);
    if (this.closeIO  == true) {
      daemonize.closeIO();
    }
    return pid;
  } else {
    sys.puts("Daeminize process failed!");
  }
}

Daemonize.prototype.stop = function() {
  try {
    process.kill(parseInt(fs.readFileSync(this.config.pids_dir + '/' + this.config.pid_base_name + '_' + this.config.port + '.pid')));
    fs.unlinkSync(this.config.pids_dir + '/' + this.config.pid_base_name + '_' + this.config.port + '.pid');
  } catch (e) {
    sys.puts("Daemon is not running! In fact, I did not find the PID file!");
  }
  
  if (restart == false) {
    process.exit(0);
  }
}

Daemonize.prototype.status = function() {
  try {
    var pid = parseInt(fs.readFileSync(this.config.pids_dir + '/' + this.config.pid_base_name + '_' + this.config.port + '.pid'));
    sys.puts("Daemon is running! (PID: #"+pid+")");
  } catch (e) {
    sys.puts("Daemon is not running!");
  }
  process.exit(0);
}

Daemonize.prototype.daemonize = function(port) {
  this.config.port = port;
  var command_arg = argv._;
  
  switch(command_arg[0]) {
    case "stop":
      this.stop();
      break;
      
    case "start":
      pid = this.start();
      break;
      
    case "restart":
      restart = true;
      this.stop();
      this.start();
      restart = false;
      break;
      
    case "status":
      this.status();
      break;
      
    default:
      sys.puts("Usage: [NODE_ENV=production|development] node script_file [start|stop|restart|status] [-p port_number]")
      process.exit(0);
      break;
  }
  
  return pid;
}

exports.daemon = function() {
  var d = new Daemonize();
  return d;
}