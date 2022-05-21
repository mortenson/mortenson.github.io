/**
 * @file
 * Provides Worker callbacks to not block the main thread.
 */

/**
 * Loads an index to initialize a search.
 *
 * @param {object} data
 *   The event data.
 * @param {string} data.lunrPath
 *   The path to the lunr library, in case it needs loaded.
 * @param {string} data.indexPath
 *   The path to the index file.
 * @param {string} data.id
 *   The lunr search ID.
 */
function loadIndex(data) {
  if (!this.scripts_loaded) {
    this.importScripts(data.lunrPath);
    this.scripts_loaded = true;
  }
  var request = new XMLHttpRequest();
  var self = this;
  request.addEventListener('load', function() {
    self.indexes = self.indexes || {};
    self.indexes[data.id] = lunr.Index.load(JSON.parse(this.responseText));
    postMessage({type: 'loadIndexComplete', id: data.id});
  });
  request.open('GET', data.indexPath);
  request.send();
}

/**
 * Performs a search and returns results to the client.
 *
 * @param {object} data
 *   The event data.
 * @param {string} data.search
 *   The search string.
 * @param {object} data.fields
 *   An object mapping index field names to values.
 * @param {string} data.id
 *   The lunr search ID.
 */
function search(data) {
  // Due to a limitation in Lunr that does not allow clause groups, we have to
  // make two queries and combine the results.
  // This is because a query string like:
  // > foo bar +type:baz
  // Will return results that do not contain "foo" or "bar", but do have the
  // "type" field set to "baz".
  // We could change the string to:
  // > +foo +bar +type:baz
  // But that would only show results that contain "foo" and "bar".
  // What we really want is something like this:
  // > +(foo bar) +type:baz
  // Which would be (foo OR bar) AND type:baz, but that isn't possible.
  var results = this.indexes[data.id].search(data.search);
  if (Object.keys(data.fields).length) {
    var queryParts = [];
    for (var key in data.fields) {
      if (data.fields[key] === '') {
        continue;
      }
      var operator = typeof data.operators[key] ? data.operators[key] : 'AND';
      data.fields[key].split(' ').forEach(function (value) {
        value = value.trim().length ? value : '*';
        var prefix = '+';
        if (operator === 'OR') {
          prefix = '';
        }
        queryParts.push(prefix + key + ':' + value);
      });
    }
    var results2 = this.indexes[data.id].search(queryParts.join(' '));
    results = results.filter(function (result1) {
      return results2.some(function (result2) {
        return result2.ref === result1.ref;
      })
    });
  }
  this.postMessage({type: 'searchComplete', results, id: data.id});
}

/**
 * Listens to search events.
 */
this.addEventListener('message', function(event){
  switch (event.data.type) {
    case 'loadIndex':
      loadIndex(event.data);
      break;
    case 'search':
      search(event.data);
      break;
    default:
      throw new Error('Unknown message sent to lunr search worker.');
  }
});
