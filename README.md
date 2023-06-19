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

Pull requests & issues welcome!

### Accessibility

Accessibility is a fundamental part of web design, and something we consider critical to the further development of this extension. Future contirbutions should aim to meet [WCAG2.1 AA](https://www.w3.org/TR/WCAG21/)—if you notice any areas where we're failing, please raise them as issues or submit PRs to address them.

Common issues to check:

1. Verify all functionality is usable with keyboard-only control
2. Open your screenreader ([VoiceOver](https://support.apple.com/en-gb/guide/voiceover/vo2682/mac) is built-in for macOS, or [Narrator](https://support.microsoft.com/en-us/windows/chapter-1-introducing-narrator-7fe8fd72-541f-4536-7658-bfc37ddaf9c6#ID0EDDBBDBD) in Windows) and confirm navigating across the widget provides clear, contextual, and useful information akin to what is shown visually.
3. Confirm colours satisfy contrast requirmeents using a tool such as [colourcontrast.cc](https://colourcontrast.cc/)

### Code overview

The extension's functionality mainly relies on two views:

1. **Options View** - Located in the `src/options/` directory. This view displays the page users see when they access the extension's options using the specified chrome-extension URL. Here, you'll find both the markup and behavior logic for the options page.

2. **Widget View** - Found in `src/components/widget.js`, this view represents the popup that appears when users open the extension on a supported page they're browsing.

If you're new to developing browser extensions, there are a couple of crucial parts you need to be aware of:

1. **Manifest File** - Located at `src/manifest.json`. This file instructs the browser when to run which scripts (for example, "on a page that matches a GitHub pull request, run the github entrypoint"). If you plan to extend our extension's capabilities to new sites, you'll have to update this file accordingly.

2. **Background Runner** - The `src/background.js` file handles requests to the Orbit API in a separate thread, ensuring smooth performance. Look for instances of `chrome.runtime.sendMessage` to see examples of how this communication is performed.

## The Code Flow

![image](https://github.com/orbit-love/orbit-browser-extension/assets/45462299/5adce40c-7e09-4f7c-ac20-474c9f6cefc1)

There exists a dedicated entrypoint for each supported site, like `src/widget/githubEntrypoint.js`. This script is responsible for determining the right moment to attempt loading the widget: on page load, after a specific element is visible on screen, after a navigation event - this varies depending on a site-by-site basis.

During initialization, the entrypoint script also sets up an array of `Page` objects. Each `Page` represents a specific type of page on the website where our widget can load (e.g. a GitHub Issue, a GitHub Discussion). They handle all the site-specific logic. For instance, to confirm we're on a particular type of page, a `Page` object would use the `#detect()` method. Or, to figure out where to place our widget, it would use `#findInsertionPoint()`. You can get more insights into these functions in the superclass at `src/pages/page.js`.

The entry point's final task is to kickstart the `src/widget/widgetOrchestrator.js`. This script checks if our widget can load on the current page and inserts a button, the widget, and a slot for additional data in appropriate zones on the supported sites.

Lastly, most of the remaining logic takes place in `src/components/widget.js`, which handles interactions with the [Orbit API](https://api.orbit.love/) and manages the widget's various display states.

## Adding Support for a New Site

**For an example of this process being followed: https://github.com/orbit-love/orbit-browser-extension/pull/45**

To add support for a new site to the extension:

1. Create a New Entrypoint

Start by creating a new entry point file, similar to src/widget/githubEntrypoint.js. This will require understanding when to load the widget for this specific site. Broadly speaking, listening for the `DOMContentLoaded` event is a good place to start. However different sites have different requirements, so it will require some investigation to identify the appropriate events to observe for the page load lifecycle. You can have a look at how this currently works for [GitHub](https://github.com/orbit-love/orbit-browser-extension/blob/main/src/widget/githubEntrypoint.js), [Twitter](https://github.com/orbit-love/orbit-browser-extension/blob/main/src/widget/twitterEntrypoint.js) and [Gmail](https://github.com/orbit-love/orbit-browser-extension/blob/main/src/widget/gmailEntrypoint.js) for inspiration.

In creating this, you'll reach a point where you need to define the pages to pass to the widget orchestrator. So...

2. Create a New Page Class

Create a new Page class for the new site by extending `src/pages/page.js`. This class will handles page-specific logic - see the comments in the superclass for details on the functions to implement, and take inspiration from the existing types of pages.

3. Create a Page-Specific Button

This is a custom element that needs to match the styling of the new site. This will be the button that users click to open the widget. By default the widget should be named `obe-#{platform}-button` where platform is an identifier for the new site (ie "github"), but you can customise this by overriding the `#getButtonElementName` function in your page.

4. Modify the `Manifest.json` File

Update `src/manifest.json` to specify on which URLs the new entry point script should run. Be sure to follow the correct [Google Chrome extension manifest version specifications](https://developer.chrome.com/docs/extensions/mv2/manifest/).

5. (Optional) Display additional data for this specific site

The widget contains a slot called additionalData, which you can update with site-specific content. For example, on GitHub we show the number of GitHub contributions the member has made.

Remember to conduct thorough testing to ensure the new site is supported correctly and that existing functionality is not compromised. Implement automated tests, if possible, to prevent future regressions.

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
