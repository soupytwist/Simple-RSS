function parseRSS(feed, xml) {
  console.log("enter parseRSS");
  var channel = $(xml).find('channel');

  feed.title = $(channel).children('title').text();
  feed.description = $(channel).children('description').text();
  feed.link = $(channel).children('link').text();

  var items = channel.find('item');
  $.each(items, function(i) {
    feed.addItem({
      title: $(this).children('title').text(),
      description: $(this).children('description').text()
    });
  });
}

function Feed(url, data) {
  var self = this;
  this.dirty = false;
  this.extra = data.extra || {};
  this.url = url;
  this.link = data.link || null;
  this.title = data.title || null;
  this.description = data.description || null;
  this.items = ko.observableArray();
  this.addItem = function(item) {
    self.items.push(item);
  };

  this.load = function loadRssFeed(cb) {
    function parseFeed(xml) {
      parseRSS(self, xml);
      cb();
    }
    console.log("sending request");
    $.ajax({
      url: self.url,
      success: parseFeed,
      error: function(xhr, statusText) {
        if (navigator.mozNotification) {
          navigator.mozNotification.createNotification("Failed to load " + url, statusText).show();
        }
      }
    });
  };
}

