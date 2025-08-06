
// Use cache to speed things up
browser.storage.local.get(["title", "subtitle", "url", "image_url"])
       .then((item) => {
         $(document).find("#ve-img").attr("src", item.image_url);
         $(document).find("#ve-title").html(item.title);
         $(document).find("#ve-subtitle").html(item.subtitle);
         $(document).find("#ve-link").attr("href", item.url);
       })

$.get({
  url: "https://earthobservatory.nasa.gov/feeds/image-of-the-day.rss",
  dataType: "xml",
  success: function(res, status) {
    var item_rss = $(res).find("item").first();
    var item = {
      title: $(item_rss).find("title").text(),
      subtitle: $(item_rss).find("description").text(),
      url: $(item_rss).find("link").text()
    }
    var thumbnail = $(item_rss).find("media\\:thumbnail").attr("url");

    $(document).find("#ve-title").html(item.title);
    $(document).find("#ve-subtitle").html(item.subtitle);
    $(document).find("#ve-link").attr("href", item.url);

    $.get({
      url: item.url,
      dataType: "html",
      success: function(res, status) {
        var image_url = $(res).find(".panel-footer").find("a, .download-btn").attr("href");
        if (!(image_url.slice(-4).toLowerCase() in [".jpg", "png"])) {
          image_url = thumbnail;
        }
        if (typeof(image_url) === "undefined") {
          image_url = $(res).find(".panel-image").find("img").attr("src");
        }
        $(document).find("#ve-img").attr("src", image_url);
        item.image_url = image_url;
      }
    });

    browser.storage.local.set(item);
  }
});
