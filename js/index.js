/* Main script

  Check the main VisibleEarth page to get entries.
  I don't use the existing RSS feed. It regularly has problems in publishing dates
  and is quite slow to load.
*/

$.get({
  url: "https://visibleearth.nasa.gov/",
  dataType: "html",
  success: function(res, status) {
    var html = $.parseHTML(res);
    var items = $(html).find(".image__cell").map(function(index, cell) {
      var title = $(cell).find(".image--info");
      return {
        url: $(title).find("a").attr("href"),
        title: $(title).find("a").html().trim().replace(/(\s|\n|&nbsp;)*$/, ''),
        date: Date.parse($(title).find("p").first().html().replace(/^Published /, '')),
        subtitle: $(title).find("p").eq(1).html().replace(/(\s|\n|&nbsp;)*$/, '')
      }
    }).get();

    items = items.sort((a, b) => {
      var a = a["date"],
          b = b["date"];
      if (a < b) {return -1;}
      else if (a > b) {return 1;}
      else {return 0;}
    }).reverse();

    var item = items[0];
    $(document).find("#ve-title").html(item["title"]);
    $(document).find("#ve-subtitle").html(item["subtitle"]);
    $(document).find("#ve-title").on("click", function(event) {
      window.location.href = "https://visibleearth.nasa.gov" + item["url"];
    });

    $.get({
      url: "https://visibleearth.nasa.gov" + item["url"],
      dataType: "html",
      success: function(res, status) {
        var html = $.parseHTML(res);
        var images = $(res).find(".child-image").find("img").map(function(index, img) {
          return $(img).attr("src");
        }).get();
        // default to first image found
        var url = images[0];
        for (img of images) {
          if (/_lrg\.jpg$/.test(img)) {
            url = img;
            break;
          }
        }
        $(document).find("#ve-img").attr("src", url);
      }
    });

  }
});
