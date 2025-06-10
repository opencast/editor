Opencast Video Editor
=====================
asdf
[![Build & Deploy](https://github.com/opencast/opencast-editor/workflows/Build%20&%20Deploy/badge.svg)
](https://github.com/opencast/opencast-editor/actions?query=workflow%3A%22Build+%26+Deploy%22)
[![Demo deployment](https://img.shields.io/badge/demo-editor.opencast.org-blue)
](https://editor.opencast.org)

The Opencast Video Editor is a tool included by [Opencast](https://opencast.org) to cut and arrange recordings.


Quick Test
----------

To test locally, run:

    npm start

This will start a local test server in the development mode.
Open [http://localhost:3000](localhost:3000) to view it in the browser.

The latest version connected to [develop.opencast.org](https://develop.opencast.org) is also publicly available
at [editor.opencast.org](https://editor.opencast.org).

To open a specific event with the editor, use the GET-Parameter `id` like so: `https://editor.opencast.org/?id=27cd7156-fda6-4b31-aab5-d56833012caf`.


Building the Editor
-------------------

To build the editor for production to the `build` folder, run:

    npm run build

To make the editor work in a sub-path, use:

    PUBLIC_URL=/path npm run build

To build a container image, run:

    DOCKER_BUILDKIT=1 docker build \
        --build-arg NODE_VERSION=16 \
        --build-arg CADDY_VERSION=2.5.1 \
        --build-arg PUBLIC_URL=/ \
        --build-arg REACT_APP_SETTINGS_PATH=/editor-settings.toml \
        -t quay.io/opencast/editor .

Configuration
-------------


### Configuration Methods

Most configuration options can be set either as an option in the configuration file or as a URL parameter.

The configuration file is called `editor-settings.toml`. It can either be provided in the public folder when running locally or can be found under `etc/opencast/ui-config/mh_default_org/editor` when deployed in Opencast. More information can be found in the example configuration file.

If a configuration option belongs to a section, URL parameters are a combination of section and option separated by a single dot.

For example, the following option in the configuration file:

```toml
[trackSelection]
show = true
```

…can be specified as URL parameter in the form `trackSelection.show=true`.

If an option can be specified both ways, the URL parameter will always take precedence.


### Settings

Options which are usually specified in the configuration file are documented in there as well. Metadata configuration options are only documented in the configuration file.

| Option                  | URL | File | Description                                                          |
|-------------------------|-----|------|----------------------------------------------------------------------|
| id                      | ✓   | ✓    | Id of the event that the editor should open by default.              |
| mediaPackageId          | ✓   | ✓    | Deprecated. Use `id` instead.                                        |
| allowedCallbackPrefixes | ✗   | ✓    | Allowed callback prefixes in callback url.                           |
| callbackUrl             | ✓   | ✓    | Callback url to go back after finish.                                |
| callbackSystem          | ✓   | ✓    | Callback system name to go back to.                                  |
| opencast.url            | ✗   | ✓    | URL of the opencast server to connect to.                            |
| opencast.name           | ✗   | ✓    | Opencast user to use. For demo purposes only.                        |
| opencast.password       | ✗   | ✓    | Password to use for authentication. For demo purposes only.          |
| metadata.show           | ✓   | ✓    | Show metadata tab.                                                   |
| trackSelection.show     | ✓   | ✓    | Show track selection tab.                                            |
| thumbnail.show          | ✓   | ✓    | Show thumbnail tab. Demo only.                                       |
| debug                   | ✓   | ✗    | Enable internationalization debugging.                               |
| lng                     | ✓   | ✗    | Select a specific language. Use language codes like `de` or `en-US`. |

How to cut a release for Opencast
---------------------------------

1. (Optional) Run the [Update translations](https://github.com/opencast/opencast-editor/actions/workflows/update-translations.yml) workflow, to make sure all changes from crowdin are included in the next release.
1. Run the [Create release tag](https://github.com/opencast/opencast-editor/actions/workflows/create-release.yml) workflow from the branch you want to release.
    - This will create the tag in the forman N.x-YYYY-MM-DD
    - It will then create a new [GitHub release](https://github.com/opencast/opencast-editor/releases)
        - Review and edit the release to make sure the release notes are correct
            - By selecting the previous release, Github can generate release notes automatically
    - Finally it will create an upstream PR to the relevant [Opencast](http://github.com/opencast/opencast) branch incorporating the new release

Cutting manually

1. Switch to the commit you want to turn into the release - make sure this is the on `develop` or an `r/N.x` branch
1. Create and push a new tag
   ```bash
    BRANCH=N.x (make sure the version you write here matches the branch you have checked out)
    DATE=$(date +%Y-%m-%d)
    git tag -m "Release $BRANCH-$DATE" -s "$BRANCH-$DATE"
    git push upstream "$BRANCH-$DATE":"$BRANCH-$DATE"
   ```
1. Wait for the [Create release](https://github.com/opencast/opencast-editor/actions/workflows/process-release.yml)
   workflow to finish
    - It will then create a new [GitHub release](https://github.com/opencast/opencast-editor/releases)
        - Review and edit the release to make sure the release notes are correct
            - By selecting the previous release, Github can generate release notes automatically
    - Finally it will create an upstream PR to the relevant [Opencast](http://github.com/opencast/opencast) branch incorporating the new release


Opencast API used by the Editor
-------------

The editor accesses the following endpoints in Opencast:

* `/editor/<mediaPackageId>/edit.json`      (introduced in OC 9.3)
* `/editor/<mediaPackageId>/metadata.json`  (introduced in OC 9.4)

If you want to use current editor frontend with an earlier Opencast version, you will have to cherry pick the relevant commits from the Opencast repository yourself.


Translating the Editor
-------------
You can help translating the editor to your language on [crowdin.com/project/opencast-editor](https://crowdin.com/project/opencast-editor). Simply request to join the project on Crowdin and start translating. If you are interested in translating a language which is not a target language right now, please create [a GitHub issue](https://github.com/opencast/opencast-editor/issues) and we will add the language.

This project follows the general form of [Opencast's Localization Process](https://docs.opencast.org/develop/developer/#participate/localization/), especially regarding what happens when you need to [change an existing translation key](https://docs.opencast.org/develop/developer/#participate/localization/#i-need-to-update-the-wording-of-the-source-translation-what-happens).  Any questions not answered there should be referred to the mailing lists!

Notes on Waveform Generation
----------------------------

The editor displays a waveform image on the timeline in the cutting view. This waveform image is generated at runtime
from one of the videos of the event. However, to properly generate the image, the video it is generated from needs to be
loaded completely once, which takes time and bandwidth. If this poses a problem for your use case, you can instead have
Opencast provide an image in the internal publication. Provided images will always take precedence and prevent the
generation algorithm form running. The provided image should have the same flavor that is specified in the Opencast
configuration file `etc/org.opencastproject.editor.EditorServiceImpl.cfg`.
