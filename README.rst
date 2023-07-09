
README
======

A nice home webpage with the latest image from
`<http://visibleearth.nasa.gov>`__.
The high-resolution image is displayed in full, in landscape.
A small caption gives the title and links to the corresponding
VisibleEarth webpage.

The image is locally cached, so that is not repeatedly downloaded.
A php script looks at the RSS feed to see if the cached image is the latest.
It can be run every now and then, or at login.

The image itself (the large/high-res version) is found by webcrawling
the VisibleEarth webpage; hackish but so far it has been effective.

Requires Curl libraries, and `SimpleDOM <https://simplehtmldom.sourceforge.io/>`__.
GD library are used to put the image in landscape if necessary.

You can clone this in any webroot subfolder and move index.html and style.css up a directory.
