
# Visible Earth Homepage

A nice homepage with the latest images from http://visibleearth.nasa.gov.

The high-resolution image is displayed in full width.
A small caption gives the title and links to the corresponding VisibleEarth webpage.
Buttons allow to go through the last 4 most recent images (which are cached).
Which image is currently viewed is saved in local storage; it is reset when a new image is available.

The links to the articles are found from the VisibleEarth RSS flux, and the image itself (the high-res version) is found by webcrawling; hackish but so far it has been effective.
It is not possible to do that with Javascript in the browser − possibly with an extension, one day maybe :).
Instead this is done by a Python script that download the images and save other information to a JSON file. This can run at startup and every now and then.
The files must be served by http to be accessible by js, since we use python already: `python -m http.server` works well.

## Requirements

- Python >=3.10
- BeautifulSoup
- lxml

## Systemd

Systemd services files are provided to setup this easily, copy the files from `systemd` to `~/.config/systemd/user`, adapt the directories therein and activate with:
``` shell
systemctl --user enable visible-earth visible-earth-scrap visible-earth-server
systemctl --user start visible-earth visible-earth-scrap visible-earth-server
```

Check things are running smoothly with
``` shell
journalctl --user -u 'visible-earth*'
```
