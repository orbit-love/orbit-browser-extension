<p align="center">
  <a href="orbit.love">
    <img alt="Orbit" src="https://app.orbit.love/orbit-logo-color-3x.png" width="120" />
  </a>
</p>
<h1 align="center">
  Orbit Browser Extension
</h1>

<div align="center">
  <a href="https://chrome.google.com/webstore/detail/orbit/ibgahekkldapaohbpmpbckmeljidicmn">
    <img width="1400" alt="A screenshot of the Orbit Browser extension, shown on a GitHub Pull Request. The legend reads: 'Community data at your fingertips. One-click overview of your community members, inside GitHub, Twitter, LinkedIn, and Gmail.'" src="https://github.com/orbit-love/ops/assets/2587348/729fe4f4-247d-4de2-ae0f-491d8b985564">
  </a>
</div>

<br />

<p align="center">
    Community data at your fingertips, available inside GitHub, Twitter, LinkedIn, and Gmail.
    <br />
    <a href="https://chrome.google.com/webstore/detail/orbit/ibgahekkldapaohbpmpbckmeljidicmn">Get it on the Chrome web store</a> (requires an <a href="https://orbit.love">Orbit</a> account).
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
4. Select the `orbit-browser-extension/dist` folder;
5. An Orbit logo should appear in the top-right corner of Chrome indicating that the extension is active;
6. Right-click on this logo, then click on Options;
7. Fill in the form with your API key and workspace name (the extension uses the prod API by default), and save;
8. Go to a GitHub repository corresponding to your workspace settings, open an issue or a pull request and voilà!


## Development

Run `yarn start` to watch the changes.
Run `yarn test` to start the test suite, or `yarn test:watch` to run them continuously.

To reload the extension after some changes, open [`chrome://extensions`](chrome://extensions) and click on the “reload” button for the Orbit one.

To use the local API instead of the prod one, change `ORBIT_ROOT_URL` in `orbit-helper.js` to your ngrok tunnel address.

## Deployment

To deploy a new version of the browser extension:

- Create a new Release in GitHub:
  - Create a new commit on `main` titled `Prepare release X.Y.Z` with version bumps in `package.json`, `src/manifest.json`, and a CHANGELOG entry;
  - Tag that commit with the new version: `git tag -a X.Y.Z -m 'vX.Y.Z'`
  - Push the commit and the tags: `git push && git push --tags`
  - [Create a new release in GitHub](https://github.com/orbit-love/orbit-browser-extension/releases/new)
- Run `yarn build`;
- Zip the `dist` folder;
- On the [Google Webstore Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) (requires authentication), upload the zip file and submit a new version.

## About Orbit

Thousands of businesses use [Orbit](https://orbit.love) to grow and measure their community across any platform.
