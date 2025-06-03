"""Module to manage images from VisibleEarth.

A function update our database (a simple json file + images files).
"""

__version__ = "0.1.0"

import json
import locale
import logging
import os
import re
import urllib.request
from datetime import datetime
from os import path

from bs4 import BeautifulSoup
from bs4.element import Tag

locale.setlocale(locale.LC_TIME, "en_US.utf8")

feed_url = "https://visibleearth.nasa.gov/feeds/all.rss"

log = logging.getLogger(__name__)


class Item:
    """Daily image."""

    title: str
    guid: str
    ve_link: str
    large_link: str
    img_file: str
    date: datetime

    @classmethod
    def from_tag(cls, tag: Tag) -> "Item":
        """Create item from scraped tag."""
        item = cls()

        try:
            item.title = tag.title.string
            item.guid = "-".join(tag.guid.string.split("/")[-2:])
            item.ve_link = tag.link.string
            item.large_link = ""
            item.img_file = ""
            item.date = datetime.strptime(
                tag.pubDate.string, "%a, %d %b %Y %H:%M:%S %z"
            )
        except Exception as err:
            log.error("Malformed item tag:\n%s", item)
            raise err

        return item

    def encode(self) -> dict:
        """Return encoded dict for json."""
        return dict(
            title=self.title,
            guid=self.guid,
            ve_link=self.ve_link,
            large_link=self.large_link,
            img_file=self.img_file,
            date=self.date.isoformat(),
        )

    @classmethod
    def decode(cls, dct) -> "Item":
        """Return Item object from json dict."""
        item = cls()
        item.title = dct["title"]
        item.ve_link = dct["ve_link"]
        item.large_link = dct["large_link"]
        item.img_file = dct["img_file"]
        item.date = datetime.fromisoformat(dct["date"])
        return item

    def find_image(self) -> None:
        """Scrape the VisibleEarth webpage for large picture."""
        with urllib.request.urlopen(self.ve_link) as html:
            dom = BeautifulSoup(html.read(), "html.parser")

        div = dom.find_all("div", class_="child-images")[0]
        images = list(div.find_all("img"))

        max_image = images[0]
        max_size = 0
        size_re = re.compile(r"(\d{1,4}) x (\d{1,4})")
        for img in images:
            # look at description to find the image size
            descr = div.find_all("div", id=img["id"].replace("image", "info"))[0]
            if descr.p is None:
                continue
            m = size_re.search(" ".join(descr.p.strings))
            if m is None:
                continue
            try:
                w, h = int(m[1]), int(m[2])
                size = w * h
                log.debug("image %s, size %d x %d", img["id"], w, h)
                if size > max_size:
                    max_size = size
                    max_image = img
            except Exception:
                continue

        self.large_link = max_image["src"]
        self.img_file = self.guid + path.splitext(self.large_link)[1]
        log.debug("largest image found: %s", self.large_link)


class Database:
    """Database of images."""

    max_items = 4
    """Max number of images to download."""

    images_dir: str
    """Directory for image files and information file."""
    db_file: str
    """Database/information file location"""
    entries: dict[str, Item]
    """Mapping of image guid to item."""

    def __init__(self) -> None:
        current_dir = path.dirname(path.realpath(__file__))
        self.images_dir = path.join(current_dir, "images")
        self.db_file = path.join(self.images_dir, "db.json")
        self.entries = {}

    def load_json(self) -> None:
        """Load information from json file."""
        with open(self.db_file) as fp:
            dct = json.load(fp)
        self.entries = {it["guid"]: Item.decode(it) for it in dct["entries"]}

    def to_json(self) -> None:
        """Write information to json file."""
        with open(self.db_file, "w") as fp:
            json.dump(
                {
                    "entries": [it.encode() for it in self.entries.values()],
                },
                fp,
            )

    def update(self) -> None:
        """Update from the VE RSS feed."""
        with urllib.request.urlopen(feed_url) as feed:
            dom = BeautifulSoup(feed.read(), features="xml")

        assert isinstance(dom.channel, Tag)

        tags = dom.channel.find_all("item", recursive=False)
        items = [Item.from_tag(tag) for tag in tags]
        # sort by most recent
        items.sort(key=lambda it: it.date, reverse=True)
        items = items[: self.max_items]

        new_entries = {it.guid: it for it in items}
        change = False
        for guid, item in new_entries.items():
            if guid not in self.entries:
                self.entries[guid] = item
        to_remove = []
        for guid in self.entries:
            if guid not in new_entries:
                to_remove.append(guid)
        for guid in to_remove:
            self.entries.pop(guid)

    def download_image(self, item: Item) -> None:
        """Download image for an entry if not already cached."""
        img_file = path.join(self.images_dir, item.img_file)
        if path.isfile(img_file):
            return

        urllib.request.urlretrieve(item.large_link, filename=img_file)

    def remove_images(self) -> None:
        """Remove files not corresponding to entries."""
        for filename in os.listdir(self.images_dir):
            fullpath = path.join(self.images_dir, filename)
            if not path.isfile(fullpath):
                continue
            if filename == "latest":
                continue
            guid, ext = path.splitext(filename)
            if ext == ".json":
                continue
            if guid not in self.entries:
                os.remove(fullpath)


if __name__ == "__main__":
    db = Database()
    # Load database (and change existing) from RSS feed
    db.update()
    # Save to json file immediately
    db.to_json()
    # Find and download images urls by scraping visibleearth
    for i, it in enumerate(db.entries.values()):
        it.find_image()
        # link to latest
        if i == 0:
            link = path.join(db.images_dir, "latest")
            target = path.join(db.images_dir, it.img_file)
            if path.exists(target) and os.readlink(link) != target:
                os.remove(link)
            if not path.exists(link):
                os.symlink(target, link)
        db.to_json()
        db.download_image(it)
    db.remove_images()
