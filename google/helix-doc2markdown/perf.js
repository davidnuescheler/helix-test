function myFunction() {
  Logger.log('--- string concat');
  stringConcat();
  Logger.log('--- api access');
  apiAccess();
  Logger.log('--- no api access');
  noApiAccess();
  Logger.log('---');
}

function stringConcat() {
  var res = "";
  for (var i=0; i< 10000; i++) {
    res += " ";
  }
}
function apiAccess() {
  var type = DocumentApp.GlyphType.BULLET;
  for (var i=0; i< 10000; i++) {
    type === DocumentApp.GlyphType.BULLET;
  }
}

function noApiAccess() {
  var type = DocumentApp.GlyphType.BULLET;
  var BULLET = DocumentApp.GlyphType.BULLET;
  for (var i=0; i< 10000; i++) {
    type === BULLET;
  }
}

/**
 * Lists the top-level folders in the user's Drive.
 */
function listRootFolders() {
  var query = '"1I_FwT5qXkZTevAeZ9EqUqLaS0RbLFkI2" in parents and trashed = false';
  var folders;
  var pageToken;
  do {
    folders = Drive.Files.list({
      q: query,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      maxResults: 100,
      pageToken: pageToken
    });
    if (folders.items && folders.items.length > 0) {
      for (var i = 0; i < folders.items.length; i++) {
        var folder = folders.items[i];
        Logger.log('%s (ID: %s) mime=%s', folder.title, folder.id, folder.mimeType);
      }
    } else {
      Logger.log('No folders found.');
    }
    pageToken = folders.nextPageToken;
  } while (pageToken);
}