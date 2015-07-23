// Nook Harquail
var express = require("express");
var logfmt = require("logfmt");
var Slack = require("slack-client");
var request = require('request');
var app = express();
var port = process.env.PORT || 5000;
var bodyParser = require('body-parser');
var env = require('node-env-file');
var later = require('later');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // to support URL-encoded bodies
var http = require('http');
var https = require('https');
app.use(logfmt.requestLogger());
env(__dirname + '/.env');

var token = process.env.SLACK_BOT_TOKEN, // Add a bot at https://my.slack.com/services/new/bot and copy the token here.
autoReconnect = true,
autoMark = true;

var slack = new Slack(token, autoReconnect, autoMark);
slack.login();

var lastUrgentMessageTime = 0.0;

slack.on('open', function() {

  var channels = [],
  groups = [],
  unreads = slack.getUnreadCount(),
  key;

  var text = 'every 5 secs';
  var s = later.parse.text(text);
  var curChan = slack.getChannelGroupOrDMByName("#info");
  var timer2 = later.setInterval(sendMessageToChannel.bind(null,curChan,"hi"), s);

  var curChan = slack.getChannelGroupOrDMByName("nook_portfolio");
  var timer3 = later.setInterval(sendMessageToChannel.bind(null,curChan,"hello there"), s);

 function sendMessageToChannel(curr,message) {
   curr.send(message);
 }

  for (key in slack.channels) {

    // console.log(slack.channels[key].name);
    // slack.joinChannel(slack.channels[key].name,console.log);

    if (slack.channels[key].is_member) {
      channels.push('#' + slack.channels[key].name);
    }
  }

  for (key in slack.groups) {
    if (slack.groups[key].is_open && !slack.groups[key].is_archived) {
      groups.push(slack.groups[key].name);
    }
  }



  console.log('Welcome to Slack. You are @%s of %s', slack.self.name, slack.team.name);
  console.log('You are in: %s', channels.join(', '));
  console.log('As well as: %s', groups.join(', '));
  console.log('You have %s unread ' + (unreads === 1 ? 'message' : 'messages'), unreads);
});


slack.on('error', function(error) {

console.error('Error: %s', error);
});


app.get('/', function(req, res) {
res.send('Hello World!');
});


var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
console.log("Listening on " + port);
});
