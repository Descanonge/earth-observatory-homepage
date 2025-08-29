
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
  url: "https://earthobservatory.nasa.gov/feeds/image-of-the-day.rss",
  dataType: "xml",
  success: function(res, status) {
    // Need a virtual document to avoid loading images
    var ownerDocument = document.implementation.createHTMLDocument('virtual');
    var item_rss = $(res, ownerDocument).find("item").first();
    var item = {
      title: $(item_rss).find("title").text(),
      subtitle: $(item_rss).find("description").text(),
      url: $(item_rss).find("link").text()
    }
    var thumbnail = $(item_rss).find("media\\:thumbnail").attr("url");

    // if href is already set, we keep things as they are from cache
    if (document.getElementById("ve-link").href === item.url) {
      return;
    };

    document.getElementById("ve-title").textContent = item.title;
    document.getElementById("ve-subtitle").textContent = item.subtitle;
    document.getElementById("ve-link").href = item.url;
    browser.storage.local.set(item);

    $.get({
      url: item.url,
      dataType: "html",
      success: function(res, status) {
        var image_url = $(res, ownerDocument).find(".panel-footer").find("a, .download-btn").attr("href");

        // sometimes we obtain a video, in this case we use the thumbnail from rss
        if (!/\.(jpg|jpeg|png|gif)$/i.exec(image_url)) {
          image_url = thumbnail;
        }
        // sometimes there is no download button, we use the src of the panel image
        if (typeof(image_url) === "undefined") {
          image_url = $(res, ownerDocument).find(".panel-image").find("img").attr("src");
        }

        document.getElementById("ve-img").src = image_url
        browser.storage.local.set({"image_url": image_url});
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
