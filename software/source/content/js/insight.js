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
  checkAndLoad();
  setTimeout(function(){
    jsonDataDesired = JSON.stringify({"state":{"reported":{"insight_desktop_version" : app_version}}});
    updateThingStatus();
    updateAMIStatus();
  }, 1000);
}

//This is the AWS IOT main code

//Include the required node modules
var AWS = require('aws-sdk');
var $ = require('jquery');
var fs = require('fs');
var os = require('os');

//App version sent to reported state as insight_desktop_version
var app_version = "1.0.0";


//Access keys are not global variables, passed as function
var credthingname;
var credregion;
var credendpoint;

//global variables
var reportedData;
var desiredData;
var jsonDataDesired;


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
  document.getElementById("thing_address").innerHTML = "IoT Device: " + credthingname;

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


// This function set the button as colored when called
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


// This function is called on a timer and updates the status of the web page if there are changes in the database
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


function checkAndLoad(){
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

  fs.readFile(fullPathName, function (err, data){
    if(err) {
      newCredentials();
    }
    else {
      credentialsInFile = JSON.parse(data).credentials;

      //now load the credentials
      credendpoint = credentialsInFile.endpoint;
      credaccess_key = credentialsInFile.access;
      credsecret_key = credentialsInFile.secret;
      credthingname = credentialsInFile.thing;
      initThing(credaccess_key, credsecret_key);
    }
  });
}


function newCredentials(){
  window.location = 'newthing.html';
  console.log("update Credentials");
}


function saveCredentialsNew(){
  //this function save a json packet to the file system with the credentials
  savethingname = document.getElementById('thingname').value;
  saveendpoint = document.getElementById('endpoint').value;
  saveaccess_key = document.getElementById('accesskey').value;
  savesecret_key = document.getElementById('secretkey').value;

  var credentialsToSave = JSON.stringify({"credentials":{"endpoint" : saveendpoint, "access" : saveaccess_key, "secret" : savesecret_key, "thing" : savethingname}});
  var homeDirectory = process.env.HOME || process.env.USERPROFILE;
  fs.writeFile(homeDirectory + '/.insight', credentialsToSave, function(err) {
    console.log('we got an error');
  })
  window.location = 'active.html';
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
