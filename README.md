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
    <img width="1400" alt="A screenshot of the Orbit Browser extension, shown on a GitHub Pull Request. The legend reads: 'Community data at your fingertips. One-click overview of your community members, inside GitHub, Twitter, LinkedIn, and Gmail.'" src="https://github.com/orbit-love/orbit-browser-extension/assets/2587348/26983029-8b80-4e4f-b9a3-15f46cfa6db2">
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

## Contributing

Pull requests welcome!

### Code overview

There are two main views for this application:

1. `src/options/`, which contains the markup & behaviour for the options page that shows when you visit chrome-extension://ibgahekkldapaohbpmpbckmeljidicmn/options.b25ed5a0.html
2. `src/components/widget.js`, which is the actual popup that shows when you open the extension on a different page.

If you are new to developing browser extensions you should also be aware of:

1. `src/manifest.json`, which decides which scripts to run when - you'll need to refer to this if you intend to add support for a new site
2. `src/background.js`, which manages requests to the Orbit API in a separate thread. Search for `chrome.runtime.sendMessage` for examples of how we use this

## The Code Flow

Each supported website has an associated entrypoint, for example `src/widget/githubEntrypoint.js`. The function of this entrypoint is to decide _when_ to try loading the widget. For example, for GitHub we can just watch for `DOMContentLoaded` & `turbo:render` events, but some sites (see gmail) require more complicated logic.

The entrypoint will also initialise an array of `Page`s on which it is able to load the widget. See `src/pages/githubDiscussionPage.js` for an example. These are responsible for page-specific logic, such as seeing if we are _on_ this page (`#detect()`) or deciding where to insert the widget (`#findInsertionPoiint()`). The superclass `src/pages/page.js` provides more context about these functions.

The final job of the entrypoint is to boot up the `src/widget/widgetOrchestrator.js`. This will use the pages to:

1. Verify if the widget can load on the current page
2. Insert a button, widget, and slot for additional data on each of the sites where we can inject a widget

The widget element is where most of the remaining logic occurs: `src/components/widget.js`. This is largely concerned with consuming the Orbit API and rendering various states for the widget accordingly.

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
