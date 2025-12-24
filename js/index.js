

function toBytes (size) {
  var units = ["B", "KB", "MB"];
  var [num, unit] = size.split(" ");
  return parseFloat(num) * 1024 ** units.indexOf(unit);
}

// Use cache to speed things up
browser.storage.local.get(["title", "subtitle", "url", "image_url", "max_width"])
       .then((item) => {
         document.getElementById("ve-img").src = item.image_url;
         document.getElementById("ve-title").textContent = item.title;
         document.getElementById("ve-subtitle").textContent = item.subtitle;
         document.getElementById("ve-link").href = item.url;
         document.getElementById("ve-img").style.maxWidth = item.max_width;
       })

var img = document.getElementById("ve-img");
// avoid too much zoom on smaller images
img.onload = function() {
  var max_width = `${2*img.naturalWidth}px`;
  img.style.maxWidth = max_width;
  browser.storage.local.set({"width": max_width});
}

$.get({
  url: "https://science.nasa.gov/earth/earth-observatory/",
  dataType: "html",
  success: function(res, status) {
    // Need a virtual document to avoid loading images
    var ownerDocument = document.implementation.createHTMLDocument('virtual');

    var item_dom = $(res, ownerDocument).find("div.hds-content-item").first();
    var item  = {
      title: $(item_dom).find("a.hds-content-item-heading").find("div").text().trim(),
      url: $(item_dom).find("a").attr("href")
    }
    thumbnail = $(item_dom).find("img").attr("src").split("?")[0];

    // if href is already set, we keep things as they are from cache
    if (document.getElementById("ve-link").href === item.url) {
      return;
    };

    document.getElementById("ve-title").textContent = item.title;
    document.getElementById("ve-link").href = item.url;
    browser.storage.local.set(item);

    $.get({
      url: item.url,
      dataType: "html",
      success: function(res, status) {
        var subtitle = $(res, ownerDocument).find("div.excerpt").find("p").text().trim();

        var image_url;
        var downloads = $(res, ownerDocument).find("div.hds-featured-file-list");
        // take the largest image using the listed size
        var max_size = 0;
        $(downloads).find("div.hds-file-list-row").each(function(index) {
          var specs = $(this).find("div.hds-file-list-filetype").find("p").text().trim();
          var [filetype, size] = /([^ ]*) \((.*)\)/.exec(specs).slice(1);

          if (!/(jpg|jpeg|png|gif)$/i.exec(filetype)) {
            return;
          }

          var size = toBytes(size);
          if (size > max_size) {
            max_size = size;
            image_url = $(this).find("div.hds-file-list-download").find("a").attr("href");
          }
        });
        console.log(image_url);

        // sometimes there is no download button, we try the first media
        if (typeof(image_url) === "undefined") {
          image_url = $(res, ownerDocument).find("div.hds-media").first().find("img").attr("src");
        }

        // sometimes the media is a video, use the thumbnail
        if (typeof(image_url) === "undefined") {
          image_url = thumbnail;
        }

        document.getElementById("ve-subtitle").textContent = subtitle;
        document.getElementById("ve-img").src = image_url
        browser.storage.local.set({"image_url": image_url, "subtitle": subtitle});
      }
    });

  }
});

// Zoom
var zoom_level = 100;
var cursor = "zoom-in";
var current_scroll = window.scrollY;

function resetZoom() {
  img.style.width = "100%";
  img.style.maxWidth = `${2*img.naturalWidth}px`;
  window.scroll({top: current_scroll});
}

function setZoom(event) {
  current_scroll = window.scrollY;
  img.style.width = `${zoom_level}%`;
  img.style.maxWidth = "";
  window.scroll({
    top: Math.max(0, event.offsetY * zoom_level / 100 - window.innerHeight/2),
    left: Math.max(0, event.offsetX * zoom_level / 100 - window.innerWidth/2),
  });
}

resetZoom();

// Grab to scroll
let pos = {top: 0, left: 0, x: 0, y: 0};

const mouseClick = function(event) {
  if (zoom_level > 100) {
    zoom_level = 100;
    cursor = "zoom-in";
    resetZoom()
  } else {
    // zoom at "natural" size of image, with minimum zoom of 150% for small images
    zoom_level = Math.max(150, Math.round(img.naturalWidth / window.innerWidth * 100));
    cursor = "zoom-out";
    setZoom(event);
  }
  img.style.cursor = cursor;
}

const mouseMoveHandler = function (event) {
  const dx = event.clientX - pos.x;
  const dy = event.clientY - pos.y;

  window.scroll({top: pos.top - dy, left: pos.left - dx});
  document.removeEventListener("mouseup", mouseClick);
};

const mouseUpHandler = function (event) {
  document.removeEventListener("mouseup", mouseClick);
  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mouseup", mouseUpHandler);

  img.style.cursor = cursor;
  img.style.removeProperty("user-select");
}

const mouseDownHandler = function (event) {
  pos = {
    left: window.scrollX,
    top: window.scrollY,
    x: event.clientX,
    y: event.clientY
  };

  document.addEventListener("mouseup", mouseClick);
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mouseup", mouseUpHandler);
  event.preventDefault()

  img.style.cursor = "grabbing";
  img.style.userSelect = "none";
};

img.addEventListener("mousedown", mouseDownHandler);
