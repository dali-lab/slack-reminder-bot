// Nook Harquail
var express = require("express");
var logfmt = require("logfmt");
var Slack = require("slack-client");
var request = require('request');
var GoogleSpreadsheet = require('google-spreadsheet');
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

var reminders_sheet = new GoogleSpreadsheet(process.env.REMINDERS_GOOGLE_URL);
var groups_sheet = new GoogleSpreadsheet(process.env.GROUP_DATES_GOOGLE_URL);
var google_creds = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY
}


var slack = new Slack(token, autoReconnect, autoMark);
slack.login();

var lastUrgentMessageTime = 0.0;



slack.on('open', function() {

  dailyCheck();
  
  }

  // once a day, check for reminders to send
  function dailyCheck(){
    // set later to use local time
    later.date.localTime();
    // this is 8 PM on July 23rd
    var elevenAM = later.parse.recur().every(1).dayOfMonth().on(11).hour();
    var tenAM = later.parse.recur().every(1).dayOfMonth().on(10).hour();

    var timer2 = later.setInterval(remindPresentingGroups, elevenAM);
    var timer3 = later.setInterval(otherReminders, tenAM);
  }

  console.log('Welcome to Slack. You are @%s of %s', slack.self.name, slack.team.name);
  console.log('You are in: %s', channels.join(', '));
  console.log('As well as: %s', groups.join(', '));
  console.log('You have %s unread ' + (unreads === 1 ? 'message' : 'messages'), unreads);
});

function consoleLog(){
  console.log("one");
}

function otherReminders(){
      // getInfo returns info about the sheet and an array or "worksheet" objects
      reminders_sheet.getInfo(function(err, sheet_info) {
        var config_sheet = sheet_info.worksheets.filter( function(worksheet) {
          return worksheet.title == 'CONFIGS';
        })[0] || sheet_info.worksheets[0];

        var now = new Date();

        // gets the rows and config values
        config_sheet.getRows(function(err, rows) {
          for (var i in rows){
            var dates = rows[i].date.split('/');
            var dateToRemind = new Date(dates[2],dates[0]-1,dates[1]);

            if(datesAreEquivalent(now,dateToRemind)){
                var channel = slack.getChannelGroupOrDMByName("#general");
                channel.send("<!everyone> Hey DALI — this is a reminder about "+rows[i].reminder+" today! :cat:");
            }

          }
        });
      });
}

function remindPresentingGroups(){
  // getInfo returns info about the sheet and an array or "worksheet" objects
  groups_sheet.getInfo(function(err, sheet_info) {
    var config_sheet = sheet_info.worksheets.filter( function(worksheet) {
      return worksheet.title == 'CONFIGS';
    })[0] || sheet_info.worksheets[0];

    var now = new Date();
    // gets the rows and config values
    config_sheet.getRows(function(err, rows) {
      for (var i in rows){
        var dates = rows[i].date.split('/');
        var dateToRemind = new Date(dates[2],dates[0]-1,dates[1]);
        // get date — remind groups 3 days before their presentation day
        dateToRemind.setDate(dateToRemind.getDate()-3);

        console.log("reminderDate",dateToRemind);
        console.log("now",now);
        if(datesAreEquivalent(now,dateToRemind)){

          var groups = rows[i].groups.split(' ');

          for (i in groups){
            console.log(groups[i]);
            var channel = slack.getChannelGroupOrDMByName(groups[i]);
            channel.send("<!channel> Hey #"+channel.name+"— this is a reminder that your group is scheduled to present at the lab meeting on "+rows[i].date+" :tada:");
          }
        }
      }
    });
  });
}

// day, year, and month are equivalent
function datesAreEquivalent(date1,date2){
  return (date1.getMonth() == date2.getMonth()) && (date1.getFullYear() == date2.getFullYear()) && (date1.getDate() == date2.getDate()) ;
}


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
