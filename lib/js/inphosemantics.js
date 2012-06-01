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

// [SRW: 2012/4/27]: For now we pull the available corpora
// and available models from a local directory.
// in the future, we will query for them when the page is loaded.
var jsondir = "../../data/inphosemantics-directory.json";
inpho.semantics.populate_modal = function (elt) {
// 1. Iterate through each corpus in the dictionary, get long label,
//    append <option value="{key}">longDescription</option> for each corpus.
// 2. Iterate through all models, do the same
  $.getJSON(jsondir, function (json) {

    var modelsData = {};
    for (corpus in json) {
      // Populate the modal with corpora.

      var corpusDescription = json[corpus]["long label"];

      $("#corporaSelect").append('<option value="' + corpus + '">' + corpusDescription + '</option>');
      
      var models = json[corpus]["models"];
      
      for (model in models) {
        // keep a running set of the models. emphasis on set.
        modelsData[model] = models[model];
      }
    }


    for (model in modelsData){
      // Populate the modal with models.
      var modelDescription = models[model]["long label"];
      $("#modelsSelect").append('<option value="' + model + '">' + modelDescription + '</option>');
    }

    // STAGE 2
    // Populate the modal with the already selected info from the URL
    params = inpho.semantics.get_params();
  
    // if there were no parameters, we have nothing to do
    if (!params) return true;

    // Process pre-selected models
    if (params.models) {
      for (var mi = 0; mi < params.models.length; mi++) {
          var selectedModel = params.models[mi];
          var anchor = "<a id=\'" + selectedModel + "\' class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
          var listItem = "<li id=\'" + selectedModel + "li\'>" + anchor + ' ' + modelsData[selectedModel]['long label'] + "</li>";
          $('#currentModels').append(listItem);
        // TODO append to $('#currentModels') an element for each selected model.
      }
    }

    // Process pre-selected corpora
    if (params.corpora) {
      for (var ci = 0; ci < params.corpora.length; ci++) {
          var selectedCorpus = params.corpora[ci];
          var anchor = "<a id=\'" + selectedCorpus + "\' class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
          var listItem = "<li id=\'" + selectedCorpus + "li\'>" + anchor + ' ' + json[selectedCorpus]['long label'] + "</li>";
          $('#currentCorpora').append(listItem);
        // TODO append to $('#currentModels') an element for each selected model.
      }
    }

    // Process pre-selected phrases
    if (params.phrases) {
      for (var ci = 0; ci < params.phrases.length; ci++) {
          var selectedPhrase = params.phrases[ci];
          var anchor = "<a id=\'" + selectedPhrase + "\' class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
          var listItem = "<li id=\'" + selectedPhrase + "li\'>" + anchor + ' ' + selectedPhrase + "</li>";
          $('#currentPhrases').append(listItem);
        // TODO append to $('#currentModels') an element for each selected model.
      }
    }

    $('#limit').val(params.searchLimit);


  });  

  

}



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

  // if there were no parameters, we have nothing to do
  if (!params) return false;

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
