/*
Copyright 2016 Microchip Technology Inc. (www.microchip.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Constant value for the timeout
const UPDATE_RATE = 400;      //400ms

//setup the window interval timer
window.onload = function(){
  //check if the config file is present
  var win_loc = window.location.href;
  if(win_loc.includes('active.html')){
      checkAndLoad();
      setTimeout(function(){
        jsonDataDesired = JSON.stringify({"state":{"reported":{"insight_on_things":{"insight_on_things_desktop_version" : app_version}}}});
        updateThingStatus();
        updateAMIStatus();
      }, 1000);
    }
}

//This is the AWS IOT main code
//Include the required node modules
var AWS = require('aws-sdk');
var SerialPort = require('serialport');
var $ = require('jquery');
var fs = require('fs');
var os = require('os');
var remote = require('remote');
var dialog = remote.require('dialog');

//App version sent to reported state as insight_desktop_version
var app_version = "2.0.0";
var raw_loaded;
var error_stack;
//serial port specific variables
var appSerialPort;
var appSerialRecData;

var loadedConfigFile

//Access keys are not global variables, passed as function
var credthingname;
var credregion;
var credendpoint;
var thingendpoint;

//Used to create and setup a USER and Thing
var accountnumber;    //returned as part of the user creation
var policyarn;        //ARN for the policy
var iam_accesskey;
var iam_accesstoken;
var iot_certarn;
var iot_certificatePEM;
var iot_privatekey;
var thingArn;
var thingmacaddr;


region = getRegion();
//global variables
var reportedData;
var desiredData;
var jsonDataDesired;
var commPortsFound = [];


function getThingStatus(){
  var params = {
    thingName: credthingname
  };

  iotdata.getThingShadow(params, function(err, data) {
    if (err) console.log('errors: '+err, err.stack); // an error occurred
    else  {
      reportedData = JSON.parse(data.payload).state.reported;
      desiredData = JSON.parse(data.payload).state.desired}
      //buttonPressed++;
  });
}

function updateThingStatus(){
  var params = {
    payload: jsonDataDesired,
    thingName: credthingname
  };

  iotdata.updateThingShadow(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log(data);
  });
}

function initThing(credaccess_key, credsecret_key){
  var extractedregion;
  extractedregion = credendpoint.split(".")[2];
  var options = {
    accessKeyId: credaccess_key,
    secretAccessKey: credsecret_key,
    region: extractedregion,
    endpoint: credendpoint,
  }

  iotdata = new AWS.IotData(options);
  //set the thingName is the title bar.
  document.getElementById("thing_address").innerHTML = "AWS Thing Name: " + credthingname;

  setInterval(updateAMIStatus, UPDATE_RATE);
  setInterval(updateLANStatus, 3000);
}

function updateLANStatus(){
  //For now test navigator.online - not 100% as may have lan but no connection
  if(navigator.onLine === true){
    //set the cloud icon for LAN present
    document.getElementById("web_present").innerHTML = "cloud_queue";
  } else {
    //set the cloud icon for LAN NOT present
    document.getElementById("web_present").innerHTML = "cloud_off";
  }

}

function setButtonColor(buttonId, buttonValue) {
    // Load which button by DOM ID
    var whichButton = document.getElementById(buttonId);
    // If false, then set to the following values
    if (buttonValue === "up") {
        whichButton.class = "button_icon";
    // If true, then set to the following values
  } else if (buttonValue === "down") {
        whichButton.class = "button_icon mdl-color--primary";
    }
}

function setPotentiometerValue(potentiometerValue) {
  //update the text to show the actual potentiometer value
  document.getElementById("potValue").innerHTML = potentiometerValue;

  // //now we have to update the progress bar
  potPercentValue = Math.round((potentiometerValue * 100) / 1024);

  document.querySelector('.mdl-js-progress').MaterialProgress.setProgress(potPercentValue);
}

function updateAMIStatus() {
    //get the current status of the thingShadow registers
    getThingStatus();

    //this code is very messy will need to clean up
    if(reportedData.button1 === "down"){
      //Set the MDL - color primary
      document.getElementById("button1").className += " mdl-color--primary";
    }else{
      //Remove the MDL - color primary
      document.getElementById("button1").className = "button_icon"
    }
    //Now lets do the remaining buttons
    if(reportedData.button2 === "down"){
      //Set the MDL - color primary
      document.getElementById("button2").className += " mdl-color--primary";
    }else{
      //Remove the MDL - color primary
      document.getElementById("button2").className = "button_icon"
    }
    if(reportedData.button3 === "down"){
      //Set the MDL - color primary
      document.getElementById("button3").className += " mdl-color--primary";
    }else{
      //Remove the MDL - color primary
      document.getElementById("button3").className = "button_icon"
    }
    if(reportedData.button4 === "down"){
      //Set the MDL - color primary
      document.getElementById("button4").className += " mdl-color--primary";
    }else{
      //Remove the MDL - color primary
      document.getElementById("button4").className = "button_icon"
    }

    //Update the potentiometer
    setPotentiometerValue(reportedData.potentiometer);

    //now we have to update the frontpage leds
    if(desiredData.led1 === "on"){
      document.querySelectorAll('.mdl-js-switch')[0].MaterialSwitch.on();
    }else {
      document.querySelectorAll('.mdl-js-switch')[0].MaterialSwitch.off();
    }
    if(desiredData.led2 === "on"){
      document.querySelectorAll('.mdl-js-switch')[1].MaterialSwitch.on();
    }else {
      document.querySelectorAll('.mdl-js-switch')[1].MaterialSwitch.off();
    }
    if(desiredData.led3 === "on"){
      document.querySelectorAll('.mdl-js-switch')[2].MaterialSwitch.on();
    }else {
      document.querySelectorAll('.mdl-js-switch')[2].MaterialSwitch.off();
    }
    if(desiredData.led4 === "on"){
      document.querySelectorAll('.mdl-js-switch')[3].MaterialSwitch.on();
    }else {
      document.querySelectorAll('.mdl-js-switch')[3].MaterialSwitch.off();
    }
}

function onLedPress(ledId) {
  // This function will be called when a LED button is pressed
  //formats the JSON payload and updates the thingShadow registers
  switch (ledId) {
      case "led1":
          // led1Value = 'off';
          if(document.getElementById('switch-1').checked === true){
            led1Value = 'on';
            document.querySelectorAll('.mdl-js-switch')[0].MaterialSwitch.on();
          }else {
            led1Value = 'off';
            document.querySelectorAll('.mdl-js-switch')[0].MaterialSwitch.off();
          };
          jsonDataDesired = JSON.stringify({"state":{"desired":{"led1" : led1Value}}});
          // if(document.getElementById('switch-1').checked === true) led1Value = 'on';
          // jsonDataDesired = JSON.stringify({"state":{"desired":{"led1" : led1Value}}});
          break;
      case "led2":
          // led2Value = 'off';
          if(document.getElementById('switch-2').checked === true){
            led2Value = 'on';
            document.querySelectorAll('.mdl-js-switch')[1].MaterialSwitch.on();
          }else {
            led2Value = 'off';
            document.querySelectorAll('.mdl-js-switch')[1].MaterialSwitch.off();
          };
          jsonDataDesired = JSON.stringify({"state":{"desired":{"led2" : led2Value}}});
          // if(document.getElementById('switch-2').checked === true) led2Value = 'on';
          // jsonDataDesired = JSON.stringify({"state":{"desired":{"led2" : led2Value}}});
          break;
      case "led3":
          // led3Value = 'off';
          if(document.getElementById('switch-3').checked === true){
            led3Value = 'on';
            document.querySelectorAll('.mdl-js-switch')[2].MaterialSwitch.on();
          }else {
            led3Value = 'off';
            document.querySelectorAll('.mdl-js-switch')[2].MaterialSwitch.off();
          };
          jsonDataDesired = JSON.stringify({"state":{"desired":{"led3" : led3Value}}});
          // if(document.getElementById('switch-3').checked === true) led3Value = 'on';
          // jsonDataDesired = JSON.stringify({"state":{"desired":{"led3" : led3Value}}});
          break;
      case "led4":
          // led4Value = 'off';
          if(document.getElementById('switch-4').checked === true){
            led4Value = 'on';
            document.querySelectorAll('.mdl-js-switch')[3].MaterialSwitch.on();
          }else {
            led4Value = 'off';
            document.querySelectorAll('.mdl-js-switch')[3].MaterialSwitch.off();
          };
          jsonDataDesired = JSON.stringify({"state":{"desired":{"led4" : led4Value}}});
          // if(document.getElementById('switch-4').checked === true) led4Value = 'on';
          // jsonDataDesired = JSON.stringify({"state":{"desired":{"led4" : led4Value}}});
          break;
  }
  //Update the thingStatus
  updateThingStatus();
  updateAMIStatus();
}

function loadConfig(loadcallback){
  //this function check for the file ~/.mchpiot and if present loads the credentials
  //if this file is not there sends to settings.html to enter and save credentials

  var homeDirectory = process.env.HOME || process.env.USERPROFILE;
  var operatingSys = os.platform();
  var credentialsInFile;


  if(operatingSys === 'darwin' || 'linux'){
    var fullPathName = homeDirectory + "/.insight";
  } else {
    var fullPathName = homeDirectory + "\\.insight";
  }

  fs.readFile(fullPathName, function(err, content){
    if (err) return loadcallback(err)
    loadcallback(null, content)
  })

}

function checkAndLoad(){
  //this function check for the file ~/.mchpiot and if present loads the credentials
  //if this file is not there sends to settings.html to enter and save credentials
  loadConfig(function (err, content){
    console.log(content);
    console.log("loading the credentials from file");
    credentialsInFile = JSON.parse(content);

    passedmac = localStorage.s_mac;

    //now load the credentials
    credendpoint = credentialsInFile.board[passedmac].endpoint;
    credaccess_key = credentialsInFile.board[passedmac].access_key;
    credsecret_key = credentialsInFile.board[passedmac].access_token;
    credthingname = passedmac;
    initThing(credaccess_key, credsecret_key);
  })
}

function deviceSetup(){
  window.location = "setup.html";
}

function deviceDebug(){
  window.location = "debug.html";
}

function goHome(){
  window.location = "index.html";
}

function readInsight(){
  loadConfig(function (err, content){
    //Now we can process the .insight file and display the Things
    if(err) deviceSetup();
    console.log("Loading the data file:");
    raw_loaded = content;

    //loadedfile = JSON.parse(content).credentials;
    var insightfile = JSON.parse(raw_loaded);
    console.log("loaded parsed file: "+JSON.stringify(insightfile));

    var numofsavedboards = Object.keys(insightfile.board).length;

    //Now we can populate the table
    for (b = 0; b <numofsavedboards; b++){
      boardmac = Object.keys(insightfile.board)[b];
      console.log("Board mac: "+boardmac);
      var table = document.getElementById("listAWSthing");
      var row = table.insertRow(0);
      var cell1 = row.insertCell(0);
      cell1.innerHTML = boardmac;

      var cell2 = row.insertCell(1);
      cell2.innerHTML = "Remove Device";
      //console.log("Loaded Data file "+loadedfile);
      var tbl = document.getElementById("listAWSthing");
      if (tbl != null) {
        for (var i = 0; i < tbl.rows.length; i++) {
          for (var j = 0; j < tbl.rows[i].cells.length; j++) {
            tbl.rows[i].cells[j].onclick = (function (i, j) {
                return function () {
                    if (j) {
                      //alert(tbl.rows[i].cells[j-1].innerHTML);
                      var selectedthing = tbl.rows[i].cells[j-1].innerHTML;
                      //console.log("Deleting thing: "+selectedthing);
                      localStorage.setItem('thing_to_delete', selectedthing);
                      window.location = "delete.html";
                      //deleteselectedthing();
                      } else {
                      //alert(tbl.rows[i].cells[j].innerHTML);
                        var selectedthing = tbl.rows[i].cells[j].innerHTML;
                        localStorage.setItem('s_mac', selectedthing);

                        displayShadow();
                      }
                    };
                  }(i, j));
        }
    }
}
}
})

}


function newCredentials(){
  window.location = 'newthing.html';
  console.log("update Credentials");
}

function deleteselectedthing(){
    //This function pops up a dialog box for admin key/token and delets the specified thing
    selectedthing = localStorage.thing_to_delete;
    console.log("Deleting the following thing: "+selectedthing);
    document.getElementById('setup_thingname').value = selectedthing;
    $('#setup_thingname').parent('div').addClass('is-dirty');
    //Pre populate the creds for now.
    document.getElementById('setup_rootkey').value = '';
    $('#setup_rootkey').parent('div').addClass('is-dirty');
    document.getElementById('setup_rootsecret').value = '';
    $('#setup_rootsecret').parent('div').addClass('is-dirty');

}

function saveCredentialsNew(){
  //this function save a json packet to the file system with the credentials
  savethingname = document.getElementById('thingname').value;
  saveendpoint = document.getElementById('endpoint').value;
  saveaccess_key = document.getElementById('accesskey').value;
  savesecret_key = document.getElementById('secretkey').value;

  //Need to upgrade the save format
  var credentialsToSave = JSON.stringify({"credentials":{"endpoint" : saveendpoint, "access" : saveaccess_key, "secret" : savesecret_key, "thing" : savethingname}});
  var homeDirectory = process.env.HOME || process.env.USERPROFILE;
  fs.writeFile(homeDirectory + '/.insight', credentialsToSave, function(err) {
    console.log('we got an error');
  })
  window.location = 'active.html';
}

function displayShadow(){

  window.location = "active.html";

  // checkAndLoad();
  // setTimeout(function(){
  //   jsonDataDesired = JSON.stringify({"state":{"reported":{"insight_on_things":{"insight_on_things_desktop_version" : app_version}}}});
  //   updateThingStatus();
  //   updateAMIStatus();
  // }, 1000);
}

function populateCredentials(new_creds){
    if (new_creds === 'NO'){
      checkAndLoad();
      //load the creds from file...
      setTimeout(function(){
        console.log('loading credentials');
        document.getElementById('thingname').value = credthingname;
        $('#thingname').parent('div').addClass('is-dirty');
        document.getElementById('endpoint').value = credendpoint;
        $('#endpoint').parent('div').addClass('is-dirty');
        document.getElementById('accesskey').value = credaccess_key;
        $('#accesskey').parent('div').addClass('is-dirty');
        document.getElementById('secretkey').value = credsecret_key;
        $('#secretkey').parent('div').addClass('is-dirty');
      }, 1000);
      console.log('Loading Credentials');
    }else {
      console.log('Create new credentials');
    }
}

function doSerial(){
  //This function discovers the serial ports, updated the DOM and opens the
  //selected port and sets uop the callback functions
  var index=0;
  SerialPort.list(function (err, ports){
    ports.forEach(function(port){
      commPortsFound[index] = port.comName;
      //Display on the console what ports were found
      console.log("Found Port# "+index+" "+commPortsFound[index]);
      index++;
    });

    for(var i = 0; i < commPortsFound.length; i++){
      var opt = commPortsFound[i];
      // console.log(opt);
      var el = document.createElement("option");
      el.textContent = opt;
      // console.log(el.textContent);
      el.value = opt;
      // console.log(el.value);
      document.getElementById("commport").appendChild(el);
    }
  });
  console.log("discovery done");
}

function enableSerial(){
  var port_name = document.getElementById('commport').value;
  if(port_name != ""){
    port_name = document.getElementById('commport').value;
    console.log("port name selected: "+port_name);
    document.getElementById('open_comm').disabled = false;
    console.log("OPEN Serial button enabled");
  }else{
    document.getElementById('open_comm').disabled = true;
    console.log("OPEN Serial button disabled");
  }
}

function openDebugSerial(){
  console.log("Opening serial port at 9600");
  var port_name = document.getElementById('commport').value;
  appSerialPort = new SerialPort(port_name, {parser: SerialPort.parsers.readline('\r'), baudrate: 9600
  });
  console.log("Serial port handle created");
  document.getElementById('debug_on').disabled = false;

  //push the selected serial port name to localStorage
  localStorage.setItem('s_serial', port_name);
  appSerialPort.on('open', function() {

      console.log('Serial Port is opened '+port_name);
      appSerialPort.on('data', function (data){
        appSerialRecData = data;
        //Need to flush the serial receive buffer
        appSerialPort.flush(function(err, results){});
        console.log("received Serial Data"+data);
        parseAppSerialData();
      });
  });

  // open errors will be emitted as an error event
  appSerialPort.on('error', function(err) {
    console.log('Error: ', err.message);
    appSerialPort.flush(function(err, results){});
  })
}

function closeDebugPort(){
  appSerialPort.close(function (data){
    console.log("closing serial port");
  });
}

function openSerialPort(){
  console.log("Opening serial port at 9600");
  var port_name = document.getElementById('commport').value;
  appSerialPort = new SerialPort(port_name, {parser: SerialPort.parsers.readline('\r'), baudrate: 9600
  });
  console.log("Serial port handle created");
  //push the selected serial port name to localStorage
  localStorage.setItem('s_serial', port_name);
  //Temp place variables in the ADMIN Key pairs
  document.getElementById('setup_rootkey').value = '';
  $('#setup_rootkey').parent('div').addClass('is-dirty');
  document.getElementById('setup_rootsecret').value = '';
  $('#setup_rootsecret').parent('div').addClass('is-dirty');

  appSerialPort.on('open', function() {
    /*appSerialPort.write('Hello World', function(err) {
      if (err) {
        return console.log('Error on write: ', err.message);
      }*/
      console.log('Serial Port is opened '+port_name);
      //document.getElementById('small').disabled = false;
      document.getElementById('create_user').disabled = false;
      document.getElementById('delete_user').disabled = false;
      sendSerialHello();
    //});
      appSerialPort.on('data', function (data){
        appSerialRecData = data;
        //Need to flush the serial receive buffer
        appSerialPort.flush(function(err, results){});
        console.log("received Serial Data"+data);
        parseAppSerialData();
      });
  });

  // open errors will be emitted as an error event
  appSerialPort.on('error', function(err) {
    console.log('Error: ', err.message);
    appSerialPort.flush(function(err, results){});
  })

  // appSerialPort.on('data', function (data){
  //   appSerialRecData = data;
  //   //Need to flush the serial receive buffer
  //   appSerialPort.flush(function(err, results){});
  //   console.log("received Serial Data"+data);
  //   //parseAppSerialData();
  // });

}

function parseAppSerialData(){
  console.log("parsing received serial string");
  //parse the debug information
  var appCommand = JSON.parse(appSerialRecData).message.command;
  console.log("received command is "+appCommand);
  switch (appCommand) {
    case "discovery":
      document.getElementById('setup_thingname').value = JSON.parse(appSerialRecData).message.discovery_object.mac_address;
      $('#setup_thingname').parent('div').addClass('is-dirty');
      break;
    case "debug":
      console.log("Debug Message is: "+ JSON.stringify(appSerialRecData));
      //Update the Debug window
      document.getElementById('board_IP').value = JSON.parse(appSerialRecData).message.debug_object.board_ip_address;
      $('#board_IP').parent('div').addClass('is-dirty');

      document.getElementById('board_mac').value = JSON.parse(appSerialRecData).message.debug_object.mac_address;
      $('#board_mac').parent('div').addClass('is-dirty');

      document.getElementById('board_endpoint').value = JSON.parse(appSerialRecData).message.debug_object.aws_iot_endpoint;
      $('#board_endpoint').parent('div').addClass('is-dirty');

      document.getElementById('rawdebug').value = JSON.parse(appSerialRecData).message.debug_object.raw_message;
      $('#rawdebug').parent('div').addClass('is-dirty');

      var tempstatus = JSON.parse(appSerialRecData).message.debug_object.socket_connected;
      if (tempstatus == true) {
        document.getElementById('socket_connection').value = "SSL Connected";
        $('#socket_connection').parent('div').addClass('is-dirty');
      } else {
        document.getElementById('socket_connection').value = "SSL NOT Connected";
        $('#socket_connection').parent('div').addClass('is-dirty');
      }

      var tempstatus = JSON.parse(appSerialRecData).message.debug_object.mqtt_connected;
      if (tempstatus == true) {
        document.getElementById('mqtt_status').value = "MQTT Client Connected";
        $('#mqtt_status').parent('div').addClass('is-dirty');
      } else {
        document.getElementById('mqtt_status').value = "MQTT NOT Connected";
        $('#mqtt_status').parent('div').addClass('is-dirty');
      }
      break;
    case "ack":
      console.log("Command successful");
      break;
    case "nack":
      console.log("Bad Command");
      break;
  }
}

function setDebugOn(){
  //function sends a serial hello string to the IoT Embedded hardware
  var appJSONmessage = JSON.stringify({
    "message":{
    "command":"debug_set",
    "debug_set_object":{
        "set":true
      }
    }
  });
  console.log("Activating Debug: "+appJSONmessage);
  appSerialPort.write(appJSONmessage+'\r', function(err) {
    appSerialPort.drain(function(err, results){});
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  });
  //Now disable the debug enable button and enable the dsiable one
  document.getElementById('debug_off').disabled = false;
  document.getElementById('debug_on').disabled = true;
  document.getElementById('open_comm').disabled = true;
  document.getElementById('commport').disabled = true;

}

function setDebugOff(){
  //function sends a serial hello string to the IoT Embedded hardware
  var appJSONmessage = JSON.stringify({
    "message":{
    "command":"debug_set",
    "debug_set_object":{
        "set":false
      }
    }
  });
  console.log("Dectivating Debug: "+appJSONmessage);
  appSerialPort.write(appJSONmessage+'\r', function(err) {
    appSerialPort.drain(function(err, results){});
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  });
  document.getElementById('debug_off').disabled = true;
  document.getElementById('debug_on').disabled = false;
  document.getElementById('open_comm').disabled = false;
  document.getElementById('commport').disabled = false;

  document.getElementById('board_IP').value = "";
  $('#board_IP').parent('div').removeClass('is-dirty');
  document.getElementById('socket_connection').value = "";
  $('#socket_connection').parent('div').removeClass('is-dirty');
  document.getElementById('board_mac').value = "";
  $('#board_mac').parent('div').removeClass('is-dirty');
  document.getElementById('mqtt_status').value = "";
  $('#mqtt_status').parent('div').removeClass('is-dirty');
  document.getElementById('board_endpoint').value = "";
  $('#board_endpoint').parent('div').removeClass('is-dirty');
  document.getElementById('rawdebug').value = "";
  $('#rawdebug').parent('div').removeClass('is-dirty');

  closeDebugPort();
}

function sendSerialHello(){
  //function sends a serial hello string to the IoT Embedded hardware
  var appJSONHello = JSON.stringify({
    "message":{
      "command":"hello"
    }
  });
  console.log("Message sent to serial: "+appJSONHello);
  appSerialPort.write(appJSONHello+'\r', function(err) {
    appSerialPort.drain(function(err, results){});
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  });
}

function sendSerialSmall(){
  //function sends a serial hello string to the IoT Embedded hardware
  var appJSONHello = JSON.stringify({
    "message":{
    "command":"wifi_configure",
    "wifi_configure_object":{
        "ap_ssid":"mchp_secure",
        "ap_password":"LetMeIn"
      }
    }
  });
  console.log("Small Message sent to serial: "+appJSONHello);
  appSerialPort.write(appJSONHello+'\r', function(err) {
    appSerialPort.drain(function(err, results){});
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  });
}

function sendSerialLarge(){
  //function sends a serial hello string to the IoT Embedded hardware
  var appJSONHello = JSON.stringify({
    "message":{
    "command":"configuration",
    "configuration_object":{
        "aws_iot_endpoint_address":"a2lp13dce8v5g3.iot.us-east-1.amazonaws.com",
        "aws_certificate": AWS_Cert,
        "aws_certificate_private_key": AWS_Key,
      }
    }
  });
  console.log("Size of message: "+appJSONHello.length);
  console.log("Large Message sent to serial: ");

  var startmessagechunk = 0;
  var messageLengthMaxChunk = 128;
  //var sentmessagelength = 0;
  //var sendstring = appJSONHello;

  if (appJSONHello.length > messageLengthMaxChunk)
  {
    var messageLength = appJSONHello.length;
    console.log("Big message size is: "+messageLength+" Sending "+messageLengthMaxChunk+" bytes at a time");

    while(startmessagechunk < messageLength){
      var serialdatachunk = appJSONHello.slice(startmessagechunk, startmessagechunk+messageLengthMaxChunk);
      console.log("Sending chunk... "+startmessagechunk+" ... "+serialdatachunk);
      appSerialPort.write(serialdatachunk, function(err) {
        appSerialPort.drain(function(err, results){});
        if (err) {
          return console.log('Error on write: ', err.message);
        }
      });
      startmessagechunk += messageLengthMaxChunk;
      //sentmessagelength = sentmessagelength+messageLengthMaxChunk;
      //sendstring = appJSONHello;
    }

    console.log('all sent');
    appSerialPort.write('\r', function(err) {
      appSerialPort.drain(function(err, results){});
      if (err) {
        return console.log('Error on write: ', err.message);
      }
    });
  }else{
    console.log("Sending as 1 chunk...");
    appSerialPort.write('\r', function(err) {
      appSerialPort.drain(function(err, results){});
      if (err) {
        return console.log('Error on write: ', err.message);
      }
    });
  }
}

function uploadCertificates(){
  //function sends a serial hello string to the IoT Embedded hardware
  var appJSONHello = JSON.stringify({
    "message":{
    "command":"configuration",
    "configuration_object":{
        "aws_iot_endpoint_address": thingendpoint,
        "aws_certificate": iot_certificatePEM,
        "aws_certificate_private_key": iot_privatekey,
      }
    }
  });

  //get the used serial port form localStorage
  port_name = localStorage.s_serial;
  console.log("Opening Serial Port:"+port_name);
  console.log("Size of message: "+appJSONHello.length);


  //setup the port
  appSerialPort = new SerialPort(port_name, {parser: SerialPort.parsers.readline('\r'), baudrate: 9600
  });
  console.log("Large Message sent to serial: ");
  console.log("Serial message is: "+appJSONHello);

  appSerialPort.on('open', function() {
    appSerialPort.write(appJSONHello+'\r', function(err) {
      console.log("Wrote Data to serial Port");
      updateCreateProcess(100, 'Done!');

      appSerialPort.drain(function(err, results){
        sendSerialHello();
      });
      if (err) {
        return console.log('Error on write: ', err.message);
      }

    });

    //});
      appSerialPort.on('data', function (data){
        appSerialRecData = data;
        //Need to flush the serial receive buffer
        appSerialPort.flush(function(err, results){});
        console.log("received Serial Data"+data);
        //parseAppSerialData();
      });
  });
  // appSerialPort.write(appJSONHello+'\r', function(err) {
  //   appSerialPort.drain(function(err, results){});
  //   if (err) {
  //     return console.log('Error on write: ', err.message);
  //   }
  // });
}

function sendSerialLarge_noChunk(){
    //function sends a serial hello string to the IoT Embedded hardware
    var appJSONHello = JSON.stringify({
      "message":{
      "command":"configuration",
      "configuration_object":{
          "aws_iot_endpoint_address": thingendpoint,
          "aws_certificate": iot_certificatePEM,
          "aws_certificate_private_key": iot_privatekey,
        }
      }
    });
    console.log("Size of message: "+appJSONHello.length);
    console.log("Large Message sent to serial: ");

    // var startmessagechunk = 0;
    // var messageLengthMaxChunk = 128;
    //var sentmessagelength = 0;
    //var sendstring = appJSONHello;
    appSerialPort.write(appJSONHello+'\r', function(err) {
      appSerialPort.drain(function(err, results){});
      if (err) {
        return console.log('Error on write: ', err.message);
      }
    });


}

function createUser(){
  //Pull MAC address from setup.html and pass to iam_createUser function
  var entereduserName = document.getElementById('setup_thingname').value;
  var admin_key = document.getElementById('setup_rootkey').value;
  var admin_token = document.getElementById('setup_rootsecret').value;
  var thingmacaddr = entereduserName;

  region = getRegion();
  console.log("Region is: "+region);

  localStorage.setItem('s_key', admin_key);
  localStorage.setItem('s_token', admin_token);
  localStorage.setItem('s_user', entereduserName);
  localStorage.setItem('s_mac', thingmacaddr);
  localStorage.setItem('s_region', region);



  //we should jump to the create screen and start the creation process
  window.location = "create.html";
  //document.getElementById('create_user').innerHTML = 'Working!';
  //window.onload = startCreation();

  //startCreation();
  //iam_createUser(entereduserName, admin_key, admin_token, region);
  //iot_setupThing(entereduserName, admin_key, admin_token, region);
}

function deviceAbout(){
  window.location = "about.html";
}

function startTeardown(){
  //window.location = "create.html";

  admin_key = localStorage.getItem('s_key');
  admin_token = localStorage.getItem('s_token');
  entereduserName = localStorage.getItem('s_user');
  thingmacaddr = localStorage.getItem('s_mac');
  loadedRegion = localStorage.getItem('s_region');
  iam_deleteUser(entereduserName, admin_key, admin_token, loadedRegion);
}

function startCreation(){
  //window.location = "create.html";

  admin_key = localStorage.getItem('s_key');
  admin_token = localStorage.getItem('s_token');
  entereduserName = localStorage.getItem('s_user');
  thingmacaddr = localStorage.getItem('s_mac');
  region = localStorage.getItem('s_region');
  iam_createUser(entereduserName, admin_key, admin_token, region);
  iot_setupThing(entereduserName, admin_key, admin_token, region);
}

function updateCreateProcess(percent, text_feedback) {
  //update the text to show the actual potentiometer value
  document.getElementById("setup_progress_text").innerHTML = text_feedback;

  // //now we have to update the progress bar
  document.querySelector('.mdl-js-progress').MaterialProgress.setProgress(percent);
}

function getRegion(){
  //This function decodes the region from the page and returns the region string
  var numberofregions = document.getElementsByName('region').length;
  for (i = 0; i < numberofregions; i++){
    if (document.getElementsByName('region')[i].checked == true) {
      var region_value = document.getElementsByName('region')[i].value;
      return(region_value);
    }
  }
}

function deleteUser(){
  //Pull MAC address from setup.html and pass to iam_deleteUser function

  var entereduserName = document.getElementById('setup_thingname').value;
  var admin_key = document.getElementById('setup_rootkey').value;
  var admin_token = document.getElementById('setup_rootsecret').value;
  document.getElementById('delete_account').disabled = true;
  document.getElementById('home').disabled = true;
  //checkAndLoad();
  loadConfig(function (err, content){
    passedmac = localStorage.thing_to_delete;
    //bring the mac address we are looking for from localstorage
    console.log(content);
    console.log("loading the credentials from file");
    credentialsInFile = JSON.parse(content);
    console.log("passed Mac address: "+passedmac);

    var insightObjectlength = Object.keys(credentialsInFile.board).length;   //How many boards do we have saved
    console.log("There are "+insightObjectlength+" boards saved!");

    for (i = 0; i<insightObjectlength; i++){
      //now we can check to see if we have a matching board
      var bn = Object.keys(credentialsInFile.board)[i];
      if(bn == passedmac){
        credendpoint = credentialsInFile.board[passedmac].endpoint;
        credaccess_key = credentialsInFile.board[passedmac].access_key;
        credsecret_key = credentialsInFile.board[passedmac].access_token;
        credthingname = passedmac;

        var loadedRegion = credendpoint.split('.')[2];
        console.log("loaded region: "+loadedRegion);
        deletefromInsight(passedmac);

        localStorage.setItem('s_key', admin_key);
        localStorage.setItem('s_token', admin_token);
        localStorage.setItem('s_user', entereduserName);
        localStorage.setItem('s_region', loadedRegion);
        localStorage.setItem('s_credaccess_key', credaccess_key);
        localStorage.setItem('s_credsecret_key', credsecret_key);

        window.location = "teardown.html";
        //iam_deleteUser(entereduserName, admin_key, admin_token, loadedRegion);
      }
    }
  })
}

function setRegion(loadedRegion){
  //we check the loaded region against the radio boxes, and set the one that matches
  var numberofregions = document.getElementsByName('region').length;
  for (i = 0; i < numberofregions; i++){
    if (document.getElementsByName('region')[i].value == loadedRegion) {
      document.getElementsByName('region')[i].parentNode.MaterialRadio.check();
    }else{
      document.getElementsByName('region')[i].parentNode.MaterialRadio.uncheck();
    }

  }
}

function iot_setupThing(mac_address, admin_key, admin_token, region){
  //this function sets up the thing, certs etc

  console.log("Setting up IOT");

  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region
  };

  var iot = new AWS.Iot(insight_IOT_options);

  //Now lets create the Key/Certs
  var params = {
    setAsActive: true
  };

  iot.createKeysAndCertificate(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
          console.log(data);           // successful response
          updateCreateProcess(40, 'Generating CERTS/Keys');
          iot_certarn = data.certificateArn;
          iot_certificatePEM = data.certificatePem;
          iot_privatekey = data.keyPair.PrivateKey;

          console.log("Certificate Arn: "+iot_certarn);
          console.log("PEM: "+iot_certificatePEM);
          console.log("PrivateKey: "+iot_privatekey);
          iot_createPolicy(mac_address, admin_key, admin_token, region);
        }
  });
}

function iot_createPolicy(mac_address, admin_key, admin_token, region){
  //Create the policy

  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region
  };

  var iot = new AWS.Iot(insight_IOT_options);


  console.log("Creating iot Policy!");
  //embed the account number into that Policy
  var insight_IOT_policy = {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
          "iot:Connect"
      ],
      "Resource": [
          "arn:aws:iot:"+region+":"+accountnumber+":client/"+mac_address,
      ]
  },
  {
      "Effect": "Allow",
      "Action": [
          "iot:Publish"
      ],
      "Resource": [
          "arn:aws:iot:"+region+":"+accountnumber+":topic/$aws/things/"+mac_address+"/shadow/update",
          "arn:aws:iot:"+region+":"+accountnumber+":topic/$aws/things/"+mac_address+"/shadow/get"
      ]
  },
  {
      "Effect": "Allow",
      "Action": [
          "iot:Subscribe"
      ],
      "Resource": [
          "arn:aws:iot:"+region+":"+accountnumber+":topicfilter/$aws/things/"+mac_address+"/shadow/update/delta",
          "arn:aws:iot:"+region+":"+accountnumber+":topicfilter/$aws/things/"+mac_address+"/shadow/update/accepted",
          "arn:aws:iot:"+region+":"+accountnumber+":topicfilter/$aws/things/"+mac_address+"/shadow/update/rejected",
          "arn:aws:iot:"+region+":"+accountnumber+":topicfilter/$aws/things/"+mac_address+"/shadow/get/accepted",
          "arn:aws:iot:"+region+":"+accountnumber+":topicfilter/$aws/things/"+mac_address+"/shadow/get/rejected"
      ]
  },
  {
      "Effect": "Allow",
      "Action": [
          "iot:Receive"
      ],
      "Resource": [
          "arn:aws:iot:"+region+":"+accountnumber+":topic/$aws/things/"+mac_address+"/shadow/update/delta",
          "arn:aws:iot:"+region+":"+accountnumber+":topic/$aws/things/"+mac_address+"/shadow/update/accepted",
          "arn:aws:iot:"+region+":"+accountnumber+":topic/$aws/things/"+mac_address+"/shadow/update/rejected",
          "arn:aws:iot:"+region+":"+accountnumber+":topic/$aws/things/"+mac_address+"/shadow/get/accepted",
          "arn:aws:iot:"+region+":"+accountnumber+":topic/$aws/things/"+mac_address+"/shadow/get/rejected"
      ]
  }]
  };
  console.log("IOT Policy: "+JSON.stringify(insight_IOT_policy));

  var params = {
    policyDocument: JSON.stringify(insight_IOT_policy), /* required */
    policyName: mac_address /* required */
  };

  iot.createPolicy(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      iot_attachPloicy(mac_address, admin_key, admin_token, region);
    }
    else {
            console.log(data);           // successful response
            updateCreateProcess(50, 'Creating IoT Policy');
            iot_attachPloicy(mac_address, admin_key, admin_token, region);
    }
  });

}

function iam_createUser(mac_address, admin_key, admin_token, region_val){
  //window.location = "create.html";
  //This function creates the IAM user, Thing and Certs as required
  //window.location = 'create.html';
  console.log("Setup IAM credentials");

  //Admin credentials hard coded for now
  var insight_IAM_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region_val
  };

  var iam = new AWS.IAM(insight_IAM_options);

  //create a user
  console.log("Creating User");

  var insight_IAM_User_options = {
    UserName: mac_address,
    Path: "/IoT_App/"
  };

  iam.createUser(insight_IAM_User_options, function(err, data) {
    if (err) console.log(err, err.stack); //shit broke
    else {
      console.log(data);
      //lets extracr the account number.
      //var Arn = data;
      updateCreateProcess(10, 'Creating IAM User');
      accountnumber = data.User.Arn.split(":")[4];
      console.log("Account Number: "+accountnumber);
      //Now we can set the inline Policy

      //embed the account number into that Policy
      var insight_IAM_inline_policy = {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                  "iot:GetThingShadow",
                  "iot:UpdateThingShadow"
                ],
                "Resource": [
                  "arn:aws:iot:"+region_val+":"+accountnumber+":thing/"+mac_address
                ]
              }]
            };


      //policyarn = 'arn:aws:iot:us-east-1:'+accountnumber+':thing/*';

      console.log("Inline Policy: "+JSON.stringify(insight_IAM_inline_policy));

      var insight_IAM_policy_options = {
        PolicyDocument: JSON.stringify(insight_IAM_inline_policy),
        PolicyName: mac_address,
        UserName: mac_address
      }

      console.log("Policy Params: "+JSON.stringify(insight_IAM_policy_options));
      iam.putUserPolicy(insight_IAM_policy_options, function(err, data) {
        if (err) console.log(err, err.stack); // shit broke
        else     console.log(data);           // successful response
        {
          updateCreateProcess(20, 'Creating Inline Policy');
          //Here we get the keys
          console.log("Lets get the keys: ");

          var params = {
            UserName: mac_address
          };
          iam.createAccessKey(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
              console.log(data);           // successful response
              updateCreateProcess(30, 'Creating Access Keys');
              iam_accesskey = data.AccessKey.AccessKeyId;
              iam_accesstoken = data.AccessKey.SecretAccessKey;
              console.log("Created Keys:");
              console.log("AccessKeyId: "+iam_accesskey);
              console.log("SecretAccessKey: "+iam_accesstoken);
              //setupThing2();
            }
          });


        }
      });


    }
  });
  //setupThing2();
}

function iot_attachPloicy(mac_address, admin_key, admin_token, region){
  //this function attaches the policy to a certificate
  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region
  };

  var iot = new AWS.Iot(insight_IOT_options);

  console.log("attaching policy insight_IOT_policy to: "+iot_certarn);

  var params = {
    policyName: mac_address, /* required */
    principal: iot_certarn /* required */
  };

  iot.attachPrincipalPolicy(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
          console.log(JSON.stringify(data));           // successful response
          //iot_createthingType();
          updateCreateProcess(60, 'Attach Principle Policy');
          iot_createThing(mac_address, admin_key, admin_token, region);
      }
  });
}

function iot_createthingType(){
  username = 'martin';
  mac_address = '8675309';
  region = 'us-east-1';

  var insight_IOT_options = {
    accessKeyId: 'Not used',
    secretAccessKey: 'Not used',
    region: 'us-east-1'
  };

  var iot = new AWS.Iot(insight_IOT_options);

  console.log("creating thingType!");

  var params = {
    thingTypeName: 'awesome_pic32_board', /* required */
    thingTypeProperties: {
      searchableAttributes: [
        'IoT_Ethernet',
        /* more items */
      ],
      thingTypeDescription: 'IoT_Ethernet_Board'
    }
  };

  iot.createThingType(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
          console.log(JSON.stringify(data));           // successful response
          iot_createThing();
        }
  });


}

function iot_attachcerttoThing(mac_address, admin_key, admin_token, region){

  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region
  };

  var iot = new AWS.Iot(insight_IOT_options);

  console.log("Attaching Cert to thing!");

  var params = {
    principal: iot_certarn, /* required */
    thingName: mac_address /* required */
  };

  iot.attachThingPrincipal(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);           // successful response
      updateCreateProcess(80, 'Attach Certificate to Thing');
      //we have a setup thing, so we can get the endpoint etc.
      var params = {
        };

        iot.describeEndpoint(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else {
               console.log(data);           // successful response
              thingendpoint = data.endpointAddress;
              console.log("Endpoint Address is: "+thingendpoint);
              updateCreateProcess(90, 'Save and Upload');

              //Upload the certs to the board
              uploadCertificates();

               //Call a function to add this to the save file
               addtoInsight(thingendpoint, iam_accesskey, iam_accesstoken, thingmacaddr);
              //  var credentialsToSave = JSON.stringify({"credentials":{"endpoint" : thingendpoint, "access" : iam_accesskey, "secret" : iam_accesstoken, "thing" : thingmacaddr}});
              //  var homeDirectory = process.env.HOME || process.env.USERPROFILE;
              //  fs.writeFile(homeDirectory + '/.insight', credentialsToSave, function(err) {
              //    console.log("Error Stack: "+JSON.stringify(err));
              //    uploadCertificates();
              //    //updateCreateProcess(100, 'Data Saved');
              //  })
               //Now we can enable the Configure button
               //document.getElementById('upload').disabled = false;
               document.getElementById('shadows').disabled = false;
               document.getElementById('home').disabled = false;
               //sendSerialHello();
             }
        });

    }
  });
}

function addtoInsight(endpoint, access_key, access_token, macaddress){
  //Display the Data
  console.log("Endpoint: "+endpoint);
  console.log("Access Key: "+access_key);
  console.log("Access Token: "+access_token);
  console.log("Mac Address: "+macaddress);

  sendSerialHello();
  loadConfig(function(err, content){
    if(err) {
      error_stack = err;
    }
    raw_loaded = content;
    console.log("Raw Loaded data: "+raw_loaded);
    if(error_stack){
      console.log("Error Stack: "+error_stack);

      //Steps 1. check for .insight file, and create it if it does not exist
      //Look at the error stack and see what we get back
      temp = JSON.stringify(error_stack);
      console.log("Error Stack from read: "+temp);
      if (temp.includes("ENOENT")){
        //File is not found so create one
        createnewInsight(endpoint, access_key, access_token, macaddress);
      }
    }
    //Step 2. Check for MAC address match, if its there just update the credentials
    console.log("Checking for a match with MAC address in file");
    var insightJSONfile = JSON.parse(raw_loaded);
    var insightObjectlength = Object.keys(insightJSONfile.board).length;   //How many boards do we have saved

    if (insightObjectlength == 0){
      //Special case for an empty File
      console.log("Empty file case");
      var newBoardJSON = JSON.parse('{"endpoint": "'+endpoint+'", "access_key": "'+access_key+'", "access_token": "'+access_token+'"}');
      console.log("New Board Data: "+JSON.stringify(newBoardJSON));
      insightJSONfile.board[macaddress] = newBoardJSON;
      console.log("Final insight file: "+JSON.stringify(insightJSONfile));

      var filetosave = JSON.stringify(insightJSONfile);

      var homeDirectory = process.env.HOME || process.env.USERPROFILE;
      fs.writeFile(homeDirectory + '/.insight', filetosave, function(err) {
        console.log("Error Stack: "+JSON.stringify(err));
        sendSerialHello();

      })
    } else {
          for (i = 0; i<insightObjectlength; i++){
            //now we can check to see if we have a matching board
            var bn = Object.keys(insightJSONfile.board)[i];
            if(bn == macaddress){
              console.log("Board already exists:");
            } else {
              console.log("Board does NOT exist:");
              //Now we can add this board and save it
              console.log("Existing JSON Save File: "+JSON.stringify(insightJSONfile));
              var newBoardJSON = JSON.parse('{"endpoint": "'+endpoint+'", "access_key": "'+access_key+'", "access_token": "'+access_token+'"}');
              console.log("New Board Data: "+JSON.stringify(newBoardJSON));
              insightJSONfile.board[macaddress] = newBoardJSON;
              console.log("Final insight file: "+JSON.stringify(insightJSONfile));

              var filetosave = JSON.stringify(insightJSONfile);

              var homeDirectory = process.env.HOME || process.env.USERPROFILE;
              fs.writeFile(homeDirectory + '/.insight', filetosave, function(err) {
                console.log("Error Stack: "+JSON.stringify(err));
                sendSerialHello();
              })
            }
          }
        }
  })
}

function createnewInsight(endpoint, access_key, access_token, macaddress){
  //no .insight file exists to create one
  console.log("No insight file exists so creating one, with following credentials");
  console.log("Endpoint: "+endpoint);
  console.log("Access Key: "+access_key);
  console.log("Access Token: "+access_token);
  console.log("Mac Address: "+macaddress);

  var credentialsToSave= '{"board" : {"'+macaddress+'":{"endpoint" : "'+endpoint+'","access_key" : "'+access_key+'","access_token" : "'+access_token+'"}}}';
  //console.log("Fred is: "+fred);
  //var credentialsToSave = JSON.stringify({"board" : {macaddress:{"endpoint" : endpoint,"access_key" : access_key,"access_token" : access_token}}});
  //var credentialsToSave = JSON.stringify(fred);
  //var credentialsToSave = fred;
  console.log("Saving file: "+credentialsToSave);
  var homeDirectory = process.env.HOME || process.env.USERPROFILE;
  fs.writeFile(homeDirectory + '/.insight', credentialsToSave, function(err) {
     console.log("Error Stack: "+JSON.stringify(err));
     sendSerialHello();
  })
}

function deletefromInsight(boardtodelete){
  //Load the insight file from disk, check for a mac address and delete it if there
  loadConfig(function (err, content){
    //passedmac = localStorage.thing_to_delete;
    //bring the mac address we are looking for from localstorage
    console.log(content);
    console.log("loading the credentials from file");
    credentialsInFile = JSON.parse(content);
    console.log("passed Mac address: "+boardtodelete);

    var insightObjectlength = Object.keys(credentialsInFile.board).length;   //How many boards do we have saved
    console.log("There are "+insightObjectlength+" boards saved!");

    for (i = 0; i<insightObjectlength; i++){
      //now we can check to see if we have a matching board
      var bn = Object.keys(credentialsInFile.board)[i];
      if(bn == boardtodelete){
        console.log("deleted the mac address "+boardtodelete+" from the disk file");
        delete credentialsInFile.board[boardtodelete];

        //Now save the file to disk
        var filetosave = JSON.stringify(credentialsInFile);
        var homeDirectory = process.env.HOME || process.env.USERPROFILE;
        fs.writeFile(homeDirectory + '/.insight', filetosave, function(err) {
          console.log("Error Stack: "+JSON.stringify(err));
        })
      }
    }
  })

}

function iot_createThing(mac_address, admin_key, admin_token, region){
  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region
  };

  var iot = new AWS.Iot(insight_IOT_options);

  console.log("creating thing!");

  //creation time

  var Systime = new Date();

  create_time = Systime.toISOString();

  var params = {
  thingName: mac_address, /* required */
  attributePayload: {
    attributes: {
      created_by: 'iot-app-v2.0.0',
      created_on: create_time
      /* anotherKey: ... */
      },
      merge: false
    },
    thingTypeName: null
  };
  console.log("Attribute Payload: "+JSON.stringify(params));

  iot.createThing(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
          updateCreateProcess(70, 'Creating Thing');
          console.log(JSON.stringify(data));           // successful response
          thingArn = data.thingArn;
          console.log("Thing ARN: "+thingArn);
          iot_attachcerttoThing(mac_address, admin_key, admin_token, region);
      }
  });

}

function iot_getcertARN(mac_address, admin_key, admin_token, region_val){
  //need to get the certificate ARN and load this into
  //iot_certarn
  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region_val
  };

  var iot = new AWS.Iot(insight_IOT_options);

  console.log("Listing the certificate ARN");
  //then we can call iot_deleteThing();
  var params = {
    thingName: mac_address /* required */
  };

  iot.listThingPrincipals(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
        console.log(data);           // successful response
        iot_certarn = data.principals[0];
        console.log("Certificate ARN: "+iot_certarn);
        updateCreateProcess(40, "Analyzing Thing Principals");
        iot_deleteThing(mac_address, admin_key, admin_token, region_val);
      }
  });
}

function iot_deleteThing(mac_address, admin_key, admin_token, region_val){
    //this function deletes the thing.
    //detach certs, and deactivate certs
    //remove cert, policy and thing

    var insight_IOT_options = {
      accessKeyId: admin_key,
      secretAccessKey: admin_token,
      region: region_val
    };

    var iot = new AWS.Iot(insight_IOT_options);

    console.log("detach policy from certificate");
    var params = {
      policyName: mac_address, /* required */
      principal: iot_certarn /* required */
    };

    iot.detachPrincipalPolicy(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
        console.log(data);           // successful response
        updateCreateProcess(50, "Detach Principle Policy");
        iot_detachThing(mac_address, admin_key, admin_token, region_val);
      }
    });
}

function iot_detachThing(mac_address, admin_key, admin_token, region_val){
  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region_val
  };

  var iot = new AWS.Iot(insight_IOT_options);

  console.log("detach thing from certificate");
  console.log("cetificate Arn: "+iot_certarn);
  var params = {
    principal: iot_certarn, /* required */
    thingName: mac_address /* required */
  };

  iot.detachThingPrincipal(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);           // successful response
      updateCreateProcess(60, "Detaching thing from Certificate");
      iot_deactivateCert(mac_address, admin_key, admin_token, region_val);
    }
  });
}

function iot_deactivateCert(mac_address, admin_key, admin_token, region_val){
  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region_val
  };

  var iot = new AWS.Iot(insight_IOT_options);

  console.log("Deactivating certificate");
  console.log("cetificate Arn: "+iot_certarn);

  var certificateId = iot_certarn.split(":")[5];
  certificateId = certificateId.slice(5);

  var params = {
    certificateId: certificateId, /* required */
    newStatus: 'REVOKED' /* required */
  };

  iot.updateCertificate(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
       console.log(data);           // successful response
       updateCreateProcess(70, "Revoking Certificate");
       iot_deleteCertificate(mac_address, admin_key, admin_token, region_val);
     }
  });
}

function iot_deleteCertificate(mac_address, admin_key, admin_token, region_val){
  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region_val
  };

  var iot = new AWS.Iot(insight_IOT_options);

  var certificateId = iot_certarn.split(":")[5];
  certificateId = certificateId.slice(5);
  console.log("Delete certificate: "+certificateId);

  var params = {
    certificateId: certificateId /* required */
  };

  iot.deleteCertificate(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
       console.log(data);           // successful response
       updateCreateProcess(80, "Delete certificate");
       iot_deletePolicyThing(mac_address, admin_key, admin_token, region_val);
     }
  });
}

function iot_deletePolicyThing(mac_address, admin_key, admin_token, region_val){
  //this function deletes the policy
  var insight_IOT_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region_val
  };

  var iot = new AWS.Iot(insight_IOT_options);

  var params = {
    policyName: mac_address /* required */
  };

  iot.deletePolicy(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
         console.log(data);           // successful response

         //Now delete the thing
         //Whats the version of the thing, need this for the next step
         var params = {
           thingName: mac_address /* required */
         };

         iot.describeThing(params, function(err, data) {
           if (err) console.log(err, err.stack); // an error occurred
           else {
             console.log(data);           // successful response
             updateCreateProcess(100, "All Deleted");
             var thingVersion = data.version;

             var params = {
               thingName: mac_address, /* required */
               expectedVersion: thingVersion
             };

             iot.deleteThing(params, function(err, data) {
               if (err) console.log(err, err.stack); // an error occurred
               else {
                    console.log(data);           // successful response
                    console.log("All Deleted...");

                    goHome();
                  //   document.getElementById('create_user').innerHTML = "Create User";
                  //   document.getElementById('delete_user').innerHTML = "Delete User";
                  //   document.getElementById('delete_user').disabled = true;
                  //   document.getElementById('configure_board').disabled = true;
                  }
             });
           }
         });
      }
  });
}

function iam_deleteUser(mac_address, admin_key, admin_token, region_val){

  var insight_IAM_options = {
    accessKeyId: admin_key,
    secretAccessKey: admin_token,
    region: region_val
  };

  var iam = new AWS.IAM(insight_IAM_options);

  var params = {
  PolicyName: mac_address, /* required */
  UserName: mac_address /* required */
  };

  iam.deleteUserPolicy(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);           // successful response
      console.log("Deleted Policy!");
      credaccess_key = localStorage.getItem('s_credaccess_key');
      updateCreateProcess(10, "Deleted IAM Policy");
      var insight_IAM_options = {
        // AccessKeyId: iam_accesskey,
        AccessKeyId: credaccess_key,
        UserName: mac_address
      };

      iam.deleteAccessKey(insight_IAM_options, function(err, data) {
        if (err) console.log(err, err.stack); //shit broke
        else {
          console.log(data);
          console.log("Deleted Keys!")
          updateCreateProcess(20, "Deleted IAM Access Keys");
          var insight_IAM_options = {
            UserName: mac_address
          };

          iam.deleteUser(insight_IAM_options, function(err, data) {
            if (err) console.log(err, err.stack); //more shit broke
            else {
              console.log(data);
              console.log("Deleted User: "+mac_address+" Gone...History!");
              updateCreateProcess(30, "Deleted IAM User");
              iot_getcertARN(mac_address, admin_key, admin_token, region_val);
              // iot_deleteThing();
            }
          })
        }
      });
    }
  });
}

function loadInsightfromfile(){
  dialog.showOpenDialog(function (fileNames) {
        // fileNames is an array that contains all the selected
       if(fileNames === undefined){
            console.log("No file selected");
       }else{
            readFile(fileNames[0]);
       }
     });
}

function readFile(filepath){
    fs.readFile(filepath, 'utf-8', function (err, data) {
          if(err){
              alert("An error ocurred reading the file :" + err.message);
              return;
          }
          // Change how to handle the file content
          console.log("The file content is : " + data);
          loadedConfigFile = JSON.parse(data);
          //console.log("Loaded Config File: "+loadedConfigFile);

          console.log("read the file, now loading the board and saving the credentials");
          //save the credentials into an insight file
          endpoint = loadedConfigFile["aws-iot-endpoint"];
          console.log("Endpoint: ",endpoint);
          access_key = loadedConfigFile["iam-insight-on-things-access-key-id"];
          console.log("Access: ",access_key);
          access_token = loadedConfigFile["iam-insight-on-things-secret-access-key"];
          console.log("secret: ",access_token);
          macaddress = loadedConfigFile["mac-address"];
          console.log("Mac Address: ",macaddress);


          //addtoInsight(endpoint, access_key, access_token, macaddress);
    });
}

function loadorcreate(){
  window.location = "loadcreate.html";

}
