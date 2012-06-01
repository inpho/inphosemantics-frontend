/* inphosemantics.js
 * Controls the rendering of the InPhOSemantics browser.
 * */

// namespace initialization
var inpho = inpho || {};
inpho.semantics = inpho.semantics || {};

// Functions to handle parameter selection

inpho.getParameter = function(name) {
  // Helper function to get parameters from URL query string
  // Source: http://stackoverflow.com/a/5158301/969863
  var match = RegExp('[?&]' + name + '=([^&]*)')
                  .exec(window.location.search);

  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

inpho.semantics.get_params = function () {
  // inpho.semantics.get_params
  // returns a JSON object with keys: models, corpora, phrases, searchLimit
  // corresponding to the URL parameters
  var models = inpho.getParameter('models');
  var corpora = inpho.getParameter('corpora');
  var phrases = inpho.getParameter('phrases');
  var searchLimit = inpho.getParameter('searchLimit') || 20;
  
  // if all three are not specified, this isn't valid
  if (!(models && corpora && phrases)) return false;

  // catch multiple models, corpora, and phrases
  models = models.split(',');
  corpora = corpora.split(',');
  phrases = phrases.split(',');

  return { 'models': models, 
           'corpora' : corpora, 
           'phrases' : phrases,
           'searchLimit' : searchLimit };
}


// Functions to handle model selection from form and from URL



// Function to handle table population

inpho.semantics.build_table = function (elt, query) {
  // inpho.semantics.build_table
  // takes an element to populate and a query JSON object containing a
  // model, corpus, term, and searchLimit. Populates the element and returns
  // true on success, false on error.
  
  // Send the request.
  $.get("/data", query, 'json')
    .success( function(data) { 
      // print the data in a 2-column table (Phrase, Similarity)
      var table = "<table>"
      table += "<tr><th>Phrase</th>"
                 + "<th>Similarity</th></tr>";
  
      // for each term in the returned list, append a table row
      for(var i = 0; i < data.length; i++){
        for(term in data[i]){
          table += "<tr><td>" + term + "</td>"
                     + "<td>" + data[i][term] + "</td></tr>";
        }
      }
  
      // close the table, append to outer element
      table += "</table>";
      $(elt).append(table);
    })
    .error( function(jqXHR) {
      // The responseText will relay the appropriate error message.
      var message = '<div class="alert alert-error">' + jqXHR.responseText + '</div>'
      $(elt).append(message);
      
      // log error in dev console
      console.log('Error! jqXHR.responseText: ' + jqXHR.responseText)
    });
}

inpho.semantics.load = function(elt) {
  // inpho.semantics.load
  // called on page load to import data from the querystring
  params = inpho.semantics.get_params();

  // iterate over all combinations and build a table in elt
  for(var mi=0; mi < params.models.length; mi++) {
    for(var ci=0; ci < params.corpora.length; ci++) {
      for(var pi=0; pi < params.phrases.length; pi++) {
        var query = { 'model' : params.models[mi],
                      'corpus' : params.corpora[ci],
                      'phrase' : params.phrases[pi],
                      'searchLimit' : params.searchLimit };
        inpho.semantics.build_table(elt, query);
      }
    }
  }
}
