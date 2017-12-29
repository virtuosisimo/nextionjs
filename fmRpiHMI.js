var screen = require('./client');
const { exec } = require('child_process');
var fs = require('fs');
var Promise = require("promise");
// Wrap the io functions with ones that return promises.
var readdir = Promise.convertNodeAsyncFunction(fs.readdir);
var readfile = Promise.convertNodeAsyncFunction( fs.readFile );

var buttonRPi = {
    id: "01",
    name: "b0",
    text: "RPi"
}

var buttonAux = {
    id: "03",
    name: "b1",
    text: "aux"
}

screen.connect();
screen.suscribeById(buttonRPi.id, function () {
    createPlaylist("/home/pi/music/");
});

screen.suscribeById(buttonAux.id, function () {
    if (buttonAux.text == "aux") {
        buttonAux.text = "playing";
        updateButtonText(buttonAux);
        execSysCommand("./playFromMic.sh");
    } else {
        buttonAux.text = "aux";
        updateButtonText(buttonAux);
        execSysCommand("killall arecord");
    }
});

function findMp3FilesInDir(path) {
    var tmpPlaylist = [];
    if (fs.lstatSync(path).isDirectory()) {
        console.log(path+" is a directory");
        var items = readdir(path);
        console.log(items.length +" files inside");
        for (var i = 0; i < items.length; i++) {
            if (fs.lstatSync(path + items[i]).isDirectory()) {
                tmpPlaylist = tmpPlaylist.concat(findMp3FilesInDir(path + items[i] + "/"));
                console.log("playlist size: "+tmpPlaylist.length);
            } else {
                if(items[i].endsWith("mp3")){
                    console.log("adding "+path+items[i]+" to the playlist");
                    tmpPlaylist.push(path+items[i]);
                }
            }
        }
        callback(tmpPlaylist);
    }
    console.log("returning playlist size: "+tmpPlaylist.length+" from "+path);
    return tmpPlaylist;
}

function createPlaylist(path){
    var playList = [];
    findMp3FilesInDir(path, function(result){
        playList = result;
        console.log("final playlist size: "+playList.length);
        console.log(playList.join("\n"));
    });
}

function updateButtonText(button) {
    screen.write.setText(button.name, button.text);
}

function execSysCommand(command, callback) {
    exec(command, (err, stdout, stderr) => {
        if (err) {
            return;
        }
        if (callback) {
            callback(stdout);
        }
    });
}