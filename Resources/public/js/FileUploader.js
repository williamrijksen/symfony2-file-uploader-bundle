function PunkAveFileUploader(options)
{
  var self = this,
    uploadUrl = options.uploadUrl,
    viewUrl = options.viewUrl,
    $el = $(options.el),
    uploaderTemplate = _.template($.trim($('#file-uploader-template').html()));
  $el.html(uploaderTemplate({}));

  var fileTemplate = _.template($.trim($('#file-uploader-file-template').html())),
    editor = $el.find('[data-files="1"]'),
    thumbnails = $el.find('[data-thumbnails="1"]');
  
  self.uploading = false;
  
  self.errorCallback = 'errorCallback' in options ? options.errorCallback : function( info ) { if (window.console && console.log) { console.log(info) } },

  self.addExistingFiles = function(files)
  {
    _.each(files, function(file) {
      appendEditableImage({
            // cmsMediaUrl is a global variable set by the underscoreTemplates partial of MediaItems.html.twig
            'thumbnail_url': viewUrl + '/thumbnails/' + file.name,
            'url': viewUrl + '/originals/' + file.name,
            'name': file.name,
            'title': file.title
        });
    });
  };

  // Delay form submission until upload is complete.
  // Note that you are welcome to examine the
  // uploading property yourself if this isn't
  // quite right for you
  self.delaySubmitWhileUploading = function(sel)
  {
    $(sel).submit(function(e) {
        if (!self.uploading)
        {
            return true;
        }
        function attempt()
        {
            if (self.uploading)
            {
                setTimeout(attempt, 100);
            }
            else
            {
                $(sel).submit();
            }
        }
        attempt();
        return false;
    });
  };

  if (options.blockFormWhileUploading)
  {
    self.blockFormWhileUploading(options.blockFormWhileUploading);
  }

  if (options.existingFiles)
  {
    self.addExistingFiles(options.existingFiles);
  }
  
  
  if (options.addCallback)
    editor.bind('fileuploadadd', options.addCallback);
  if (options.submitCallback)
    editor.bind('fileuploadsubmit', options.submitCallback);
  if (options.sendCallback)
    editor.bind('fileuploadsend', options.sendCallback);
  if (options.doneCallback)
    editor.bind('fileuploaddone', options.doneCallback);
  if (options.failCallback)
    editor.bind('fileuploadfail', options.failCallback);
  if (options.alwaysCallback)
    editor.bind('fileuploadalways', options.alwaysCallback);
  if (options.progressCallback)
    editor.bind('fileuploadprogress', options.progressCallback);
  if (options.progressallCallback)
    editor.bind('fileuploadprogressall', options.progressallCallback);
  if (options.startCallback)
    editor.bind('fileuploadstart', options.startCallback);
  if (options.stopCallback)
    editor.bind('fileuploadstop', options.stopCallback);
  if (options.changeCallback)
    editor.bind('fileuploadchange', options.changeCallback);
  if (options.pasteCallback)
    editor.bind('fileuploadpaste', options.pasteCallback);
  if (options.dropCallback)
    editor.bind('fileuploaddrop', options.dropCallback);
  if (options.dragoverCallback)
    editor.bind('fileuploaddragover', options.dragoverCallback);
  if (options.chunksendCallback)
    editor.bind('fileuploadchunksend', options.chunksendCallback);
  if (options.chunkdoneCallback)
    editor.bind('fileuploadchunkdone', options.chunkdoneCallback);
  if (options.chunkfailCallback)
    editor.bind('fileuploadchunkfail', options.chunkfailCallback);
  if (options.chunkalwaysCallback)
    editor.bind('fileuploadchunkalways', options.chunkalwaysCallback);

    editor.fileupload({
        dataType: 'json',
        url: uploadUrl,
        dropZone: $el.find('[data-dropzone="1"]'),
        done: function (e, data) {
            if (data)
            {
                _.each(data.result, function(item) {
                    appendEditableImage(item);
                });
            }
        },
        start: function (e) {
            $('#progress').removeClass('hide');
            self.uploading = true;
        },
        stop: function (e) {
            $('#progress').addClass('hide');
            self.uploading = false;
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .bar').css(
                'width',
                progress + '%'
            );
        }
    });

  // Expects thumbnail_url, url, and name properties. thumbnail_url can be undefined if
  // url does not end in gif, jpg, jpeg or png. This is designed to work with the
  // result returned by the UploadHandler class on the PHP side
  function appendEditableImage(info)
  {
    if (info.error)
    {
      self.errorCallback(info);
      return;
    }
      if (typeof info.title === "undefined") {
          info.title = '';
      }
    var li = $(fileTemplate(info));
    li.find('[data-action="delete"]').click(function(event) {
      var file = $(this).closest('[data-name]');
      var name = file.attr('data-name');
      $.ajax({
        type: 'delete',
        url: setQueryParameter(uploadUrl, 'file', name),
        success: function() {
          file.remove();
            $(thumbnails).trigger( "count_of_thumbnails_changed" );
        },
        dataType: 'json'
      });
      return false;
    });

      li.find('[data-action="edit"]').click(function(event) {
          bootbox.prompt("Geef de afbeelding een titel", function(result) {
              if (result !== null) {
                  $.ajax({
                      type: 'post',
                      url: setQueryParameter(uploadUrl, 'file', name) + '&title=' + result + '&_method=PUT',
                      success: function(value) {
                          file.find('span.titleholder').html(value);
                          $(thumbnails).trigger( "count_of_thumbnails_changed" );
                      },
                      dataType: 'json'
                  });
              }
          });
          var file = $(this).closest('[data-name]');
          var name = file.attr('data-name');
      });
    thumbnails.append(li);
      $(thumbnails).trigger( "count_of_thumbnails_changed" );
  }

  function setQueryParameter(url, param, paramVal)
  {
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1]; 
    var temp = "";
    if (additionalURL)
    {
        var tempArray = additionalURL.split("&");
        var i;
        for (i = 0; i < tempArray.length; i++)
        {
            if (tempArray[i].split('=')[0] != param )
            {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }
    var newTxt = temp + "" + param + "=" + encodeURIComponent(paramVal);
    var finalURL = baseURL + "?" + newAdditionalURL + newTxt;
    return finalURL;
  }
}


