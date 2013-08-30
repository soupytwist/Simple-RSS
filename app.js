function Storage() {
  var self = this;
  this.db = null;
  var version = 1;
  var openRequest = indexedDB.open('RssDatabase', version);

  // We can only create Object stores in a versionchange transaction.
  openRequest.onupgradeneeded = function(e) {
    self.db = e.target.result;

    if(self.db.objectStoreNames.contains("feeds")) {
      self.db.deleteObjectStore("feeds");
    }

    var store = self.db.createObjectStore("feeds", {keyPath: "url"});
  };

  openRequest.onsuccess = function(e) {
    self.db = e.target.result;
  };

  openRequest.onerror = function(e) {
    console.error('Failed to open database: ' + e);
    if (navigator.mozNotification) {
      navigator.mozNotification.createNotification("Failed to open database", e).show();
    }
  };

  this.insertFeed = function(feed) {
    var insertTransaction = self.db.transaction(['feeds'], 'readwrite');
    var feedsStore = insertTransaction.objectStore('feeds');
    var dat = {
      url: feed.url,
      title: feed.title,
      description: feed.description
    };
    var req = feedsStore.put(dat);
  };

  this.getFeeds = function(cb) {
    var trans = self.db.transaction(["feeds"], "readwrite");
    var store = trans.objectStore("feeds");

    // Get everything in the store;
    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = store.openCursor(keyRange);

    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      if(!!result == false)
        return;

      cb(result.value);
      result.continue();
    };

    cursorRequest.onerror = function(e) {
      console.error('Query error: ' + e);
      if (navigator.mozNotification) {
        navigator.mozNotification.createNotification("Query error", e).show();
      }
    };
  };
}

var stor = new Storage();

function ViewModel() {
  var self = this;
  this.showAddFeed = ko.observable(false);
  this.showSidebar = ko.observable(false);
  this.toggleAddFeed = function() {
    self.showAddFeed( ! self.showAddFeed() );
  };
  this.activeFeed = ko.observable();
  this.selectFeed = function(feed) {
    self.activeFeed(feed);
    return true;
  };
  this.toggleSidebar = function() {
    self.showSidebar(! self.showSidebar() );
  };
  this.addFeedUrl = ko.observable();
  this.activeItem = ko.observable(null);
  this.feeds = ko.observableArray();
  this.doAddFeed = function() {
    if (self.addFeedUrl()) {
      var f = new Feed(self.addFeedUrl(), {});
      f.load(function() {
        stor.insertFeed(f);
        self.feeds.push(f);
        self.addFeedUrl('');
        self.showAddFeed(false);
      });
    }
  };
  this.setActive = function(item) {
    self.activeItem(item);
  };
  this.unsetActive = function() {
    self.activeItem(null);
  };

  this.reloadFeed = function(feedData) {
    if (feedData) {
      var feed = new Feed(feedData.url, feedData);
      feed.load(function() {
        self.feeds.push(feed);
      });
    }
  };

  stor.getFeeds(this.reloadFeed);
}

$.ajaxSettings.xhr = function() {
  return new XMLHttpRequest({
    mozSystem: true
  });
};

ko.bindingHandlers.htmlText = {
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    var value = valueAccessor();
    console.log("VALUE IS: " + value);
    var domNode = document.createElement('div');
    $(domNode).html(value);
    var text = $(domNode).text();
    console.log("TEXT IS: " + text);
    $(element).text(text);
  }
};

window.onload=function() {
  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);
}
