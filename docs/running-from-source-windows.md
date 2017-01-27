### Running the Insight on Things desktop application from source
#### Windows 7 or Windows 10

---

There are few packages of software that you will need to run the __Insight on Things__ from source.

The __Insight on Things__ desktop application is run on a _specific version_ of [Electron](http://electron.atom.io/) that will need to be downloaded and installed in _specific location_ on your `C:\` drive.  The following instruction will guide you to download to required tools, compile the serial port driver, and run the program.


1. Download [Electron v0.35.4](https://github.com/electron/electron/releases/tag/v0.35.4) selecting the [electron-v0.35.4-win32-x64.zip](https://github.com/electron/electron/releases/download/v0.35.4/electron-v0.35.4-win32-x64.zip) file
- Unzip this file to your root of your `c:\` directory so the executable is located as `c:\electron-v0.35.4-win32-x64\electron.exe`
  - If you locate this at another location you will need to update your `package.json` file in the _app_ directory to the new location
- Download and install the [Node.js](https://nodejs.org/)
  - You can use LTS or current version of Node.js
  - You will need a couple of global node.js modules
  - Open your _Command Prompt_ and enter the following lines commands  
    ```
    npm install --global --production windows-build-tools
    npm install --global node-gyp
    ```
- You can use _Git_ to clone the source repository or download a zip file of the repository
  - The __Insight on Things__ repository can be found [here](https://github.com/MicrochipTech/aws-iot-insight-on-things-desktop-app)
  - On Windows, it is best to locate the source files as close to the root directory as posable due to path length issues
- Using the _Command Prompt_, change directory into the `app` directory of the source code using `cd <path to source>\aws-iot-insight-on-things-desktop-app\app`
- Run the command `npm install` in this directory; it will use the information in the `package.json` file to load the required node.js modules
- You will need to recompile the serial port code to work with Electron v0.35.4
  - Change directory wit the following command `cd node_modules\serialport`
  - Compile the serial port code with the following command:  
    ```
    node-gyp rebuild --target=0.35.4 --arch=x64 --target_platform=win32 --dist-url=https://atom.io/download/atom-shell --python=%UserProfile%\.windows-build-tools\python27\python.exe
    ```
- Return back to the `app` directory with the following command `cd ../..`
- Run the __Insight on Things__ desktop application from source with the following command `npm run start:win`
