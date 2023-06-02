# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [1.0.1] - 2023-06-02

### Fixed

- Fixed issue with null contribution count showing on some GitHub profiles

## [1.0.0] - 2023-06-02

### Added

- Brand new support for Twitter profile pages, LinkedIn profile pages, and Gmail
- Surfacing additional member information from Orbit: Last Active, Identities, Organization and more

### Improved

- Redesigned the Options page
- We revamped the Extension codebase to make it easier to add new features—and more websites

## [0.6.0] - 2023-05-05

### Added

- Added support for OAuth sign-in through Orbit (#39)

### Improved

- Run continuous tests through CircleCI (#40)

## [0.5.2] - 2023-05-03

### Fixed

- Fixed issue with widget not showing when the user is not authenticated (#38)

### Improved

- Authorization error message now redirects to the options page (#38)

### Removed

- Removed ability to “Add as content” (#38)

## [0.5.1] - 2023-04-27

### Fixed

- Fixed issue with widget not showing when navigating to it from the repository homepage (#35)

### Improved

- Enable hot-reloading for development environments (#33)
- Opening options page on initial install, & making it accessible by clicking the extension icon (#37)

## [0.5.0] - 2023-04-26

### Fixed

- Fixed an issue with the repository contribution count being incorrect in some cases (#25)
- Fixed an issue with large numbers of GitHub repositories in Orbit failing to save in Chrome storage (#26)

### Improved

- Upgraded out-of-date dependencies to latest versions (#30)

## [0.4.0] - 2022-07-18

### Added

- Added support for GitHub Discussions (#24)

### Fixed

- Fixed an issue with the widget not displaying on page transitions(4e040d5)

### Improved

- Better display of Orbit metrics (d5d6c45)

## [0.3.4] - 2021-11-17

### Fixed

- Fixed an issue with the widget not displaying (ea78b8)

## [0.3.3] - 2021-06-09

### Fixed

- Fixed an issue where a merged Orbit user would have a different URL slug to their GitHub username
- Fixed API requests for adding content to a member profile
- Changed the format of requests to update some endpoints

## [0.3.2] - 2020-02-17

### Fixed

- Fixed an issue where multiple Orbit button would sometimes appear.

## [0.3.1] - 2020-12-07

### Added

- We now show the tags of the member inside the GitHub popover, if any

## [0.3.0] - 2020-11-09

### Changed

- Move to the new /identities/github API endpoint to get GitHub-related information

### Fixed

- Fixed multiple issues with the new API response

## [0.2.3] - 2020-08-27

### Changed

- Following the release of Orbit Model 2.0 (https://github.com/orbit-love/orbit-model/issues/29), Love is now displayed instead of points

### Fixed

- Fixed a _Not a Number_ error with displaying Contributions

[0.3.2]: https://github.com/orbit-love/orbit-browser-extension/releases/tag/v0.3.2
[0.3.1]: https://github.com/orbit-love/orbit-browser-extension/releases/tag/v0.3.1
[0.3.0]: https://github.com/orbit-love/orbit-browser-extension/releases/tag/v0.3.0
[0.2.3]: https://github.com/orbit-love/orbit-browser-extension/releases/tag/v0.2.3
