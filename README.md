<p align="center">
  <a href="orbit.love">
    <img alt="Orbit" src="https://app.orbit.love/orbit-logo-color-3x.png" width="120" />
  </a>
</p>
<h1 align="center">
  Orbit Chrome Extension
</h1>

<div align="center">
  <a href="https://chrome.google.com/webstore/detail/orbit/ibgahekkldapaohbpmpbckmeljidicmn">
    <img alt="screenshot" src="https://cdn.sanity.io/images/cad8jutx/production/29bbc3dd073bc1b8e027dc56f4064ce157e85d15-800x351.gif" width="600"/>
  </a>
</div>

<br />

<p align="center">
    Add useful developer information right into GitHub issues and PRs. <a href="https://chrome.google.com/webstore/detail/orbit/ibgahekkldapaohbpmpbckmeljidicmn">Get it on the Chrome web store</a> (requires an Orbit account).
</p>

## Local installation

Clone the repository and install the dependencies:

```bash
git clone git@github.com:orbit-love/orbit-browser-extension.git
cd orbit-browser-extension
yarn && yarn build
```

On Google Chrome:

1. Open [`chrome://extensions`](chrome://extensions);
2. Toggle the “developer mode” (_wink wink_) in the top-right corner;
3. Click on “Load unpacked”;
4. Select the `orbit-browser-extension/extension` folder;
5. An Orbit logo should appear in the top-right corner of Chrome indicating that the extension is active;
6. Right-click on this logo, then click on Options;
7. Fill in the form with your API key and workspace name (the extension uses the prod API by default), and save;
8. Go to a GitHub repository corresponding to your workspace settings, open an issue or a pull request and voilà!


## Development

Run `yarn start` to watch the changes.
Run `yarn test` to start the test suite, or `yarn test:watch` to run them continuously.

To reload the extension after some changes, open [`chrome://extensions`](chrome://extensions) and click on the “reload” button for the Orbit one.

To use the local API instead of the prod one, change `ORBIT_API_ROOT_URL` in `orbit-helper.js` to your ngrok tunnel address.


## Deployment

To deploy a new version of the browser extension:

- Update the `manifest.json` version number;
- Run `yarn build`;
- Zip the `extension` folder;
- On the [Google Webstore Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) (requires authentication), upload the zip file and submit a new version.

## About Orbit

[Orbit](https://orbit.love) is the Community CRM for developers, helping organizations grow their communities and accelerate technology adoption.
