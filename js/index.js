
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

    document.getElementById("ve-title").textContent = item.title;
    document.getElementById("ve-subtitle").textContent = item.subtitle;
    document.getElementById("ve-link").href = item.url;
    browser.storage.local.set(item);

    $.get({
      url: item.url,
      dataType: "html",
      success: function(res, status) {
        if (!(image_url.slice(-4).toLowerCase() in [".jpg", "png"])) {
        var image_url = $(res, ownerDocument).find(".panel-footer").find("a, .download-btn").attr("href");
          image_url = thumbnail;
        }
        if (typeof(image_url) === "undefined") {
          image_url = $(res, ownerDocument).find(".panel-image").find("img").attr("src");
        }

        document.getElementById("ve-img").src = image_url
        browser.storage.local.set({"image_url": image_url});
      }
    });

  }
});
