# Visible Earth Homepage

An extension setting the homepage to the latest image from http://visibleearth.nasa.gov.

https://addons.mozilla.org/en-US/firefox/addon/visibleearthhomepage/

The high-resolution image is displayed in full width.
A small caption gives the title and links to the corresponding VisibleEarth webpage.

The latest entry is found by scraping the main page (the RSS flux regularly has issues with publishing dates, and is slow to load). The large image is also found by scraping the entry page.

**Disclaimer:** this is amateur code, I barely know what I am doing

This is not affiliated with NASA.

## Permissions

- webRequest
- access to `https://visibleearth.nasa.gov/*`
