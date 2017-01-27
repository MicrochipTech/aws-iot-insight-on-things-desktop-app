### Running the Insight on Things desktop application from source
#### OS X 10.11.0 or greater or macOS 10.12.0 or greater

---

There are few packages of software that you will need to run the __Insight on Things__ from source.

The __Insight on Things__ desktop application is run on a _specific version_ of [Electron](http://electron.atom.io/) that will need to be downloaded and installed in _specific location_ on your desktop.  The following instruction will guide you to download to required tools and run the program.


1. Download [Electron v0.35.4](https://github.com/electron/electron/releases/tag/v0.35.4) selecting the [electron-v0.35.4-darwin-x64.zip](https://github.com/electron/electron/releases/download/v0.35.4/electron-v0.35.4-darwin-x64.zip) file and saving it to your desktop
- Unzip this file to your desktop so the electron application is located as `~/Desktop/electron-v0.35.4-darwin-x64/Electron.app`
  - If you locate this at another location you will need to update your `package.json` file in the _app_ directory to the new location
- Download and install the [Node.js](https://nodejs.org/)
  - You can use LTS or current version of Node.js
- You can use _Git_ to clone the source repository or download a zip file of the repository
  - The __Insight on Things__ repository can be found [here](https://github.com/MicrochipTech/aws-iot-insight-on-things-desktop-app)
- Using the _Terminal_, change directory into the `app` directory of the source code using `cd <path to source>/aws-iot-insight-on-things-desktop-app/app`
- Run the command `npm install` in this directory; it will use the information in the `package.json` file to load the required node.js modules
- Run the __Insight on Things__ desktop application from source with the following command `npm run start:mac`
