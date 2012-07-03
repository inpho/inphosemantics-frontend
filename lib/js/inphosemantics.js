/* inphosemantics.js
 * Controls the rendering of the InPhOSemantics browser.
 * */


// namespace initialization
var inpho = inpho || {};
inpho.semantics = inpho.semantics || {};
inpho.semantics.cache = {"corpora":{},"models":{},"phrases":{}};




// *** ON PAGE READY *** //
$(document).ready( function() {

  // [SRW: 2012/4/27]: For now we pull the available corpora
  // and available models from a local directory.
  // in the future, we will query for them when the page is loaded.
  var jsondir = "../../data/inphosemantics-directory.json";

  $.getJSON(jsondir, function (json) {
    // require that we have available corpora and models
    // otherwise everything breaks anyway.

    // STEP 1: Gather Data
    var modelsSet = {};
    // cache each corpus
    for (corpusKey in json) {
      // Store all the same data in a more accessible format:
      var corpusObj = {};
      inpho.semantics.cache["corpora"][corpusKey] = json[corpusKey];

      var corpus = json[corpusKey];
      // create a set of models
      for (model in corpus["models"]) {
        modelsSet[model] = corpus["models"][model];
      }
    }

    // cache each model
    for(modelKey in modelsSet) {
      inpho.semantics.cache["models"][modelKey] = modelsSet[modelKey];
    }


    // STEP 2: Do the rest of the work
    inpho.semantics.load($('#content'));
    inpho.semantics.populate_selection_modal($('#selectionModal'));
    inpho.semantics.populate_export_modal($('#selectionModal'));
  });

});




// *** CACHE INTERACTION *** //

inpho.semantics.getCorpusProperty = function(corpusKey, property){
  return inpho.semantics.cache["corpora"][corpusKey][property];
}

inpho.semantics.getModelProperty = function(modelKey, property){
  return inpho.semantics.cache["models"][modelKey][property];
}

inpho.semantics.getPhraseProperty = function(phraseKey, property){
  return inpho.semantics.cache["phrases"][phraseKey][property];
}

// *** END CACHE INTERACTION *** //



// *** QUERY STRING PROCESSING *** //

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
  if (models)
    models = models.split(',');
  if (corpora)
    corpora = corpora.split(',');
  if (phrases)
    phrases = phrases.split(',');

  return { 'models': models,
           'corpora' : corpora,
           'phrases' : phrases,
           'searchLimit' : searchLimit };
}

// Functions to handle model selection from form and from URL

inpho.semantics.populate_selection_modal = function (elt) {

  // Populate the modal with corpora.
  for (corpus in inpho.semantics.cache["corpora"]) {
    var corpusDescription = inpho.semantics.getCorpusProperty(corpus, "long label");
    $("select", "#corpora").append('<option value="' + corpus + '">' + corpusDescription + '</option>');
  }

  // Populate the modal with models.
  for (model in inpho.semantics.cache["models"]) {
    var modelDescription = inpho.semantics.getModelProperty(model, "long label");
    $("select", "#models").append('<option value="' + model + '">' + modelDescription + '</option>');
  }


  // Populate the modal with the already selected info from the URL
  params = inpho.semantics.get_params();

  // Process pre-selected corpora
  if (params.corpora) {
    for (var ci = 0; ci < params.corpora.length; ci++) {
      var selectedCorpus = params.corpora[ci];
      var label = inpho.semantics.getCorpusProperty(selectedCorpus, "long label");
      inpho.semantics.addListItem("#corpora", selectedCorpus, label);
    }
  }

  // Process pre-selected models
  if (params.models) {
    for (var mi = 0; mi < params.models.length; mi++) {
      var selectedModel = params.models[mi];
      var label = inpho.semantics.getModelProperty(selectedModel, "long label");
      inpho.semantics.addListItem("#models", selectedModel, label);
    }
  }

  // Process pre-selected phrases
  if (params.phrases) {
    for (var ci = 0; ci < params.phrases.length; ci++) {
      var selectedPhrase = params.phrases[ci];
      inpho.semantics.addListItem("#phrases", selectedPhrase, selectedPhrase);
    }
  }

  // Put in the search limit value
  $('#searchLimit').val(params.searchLimit)
  inpho.semantics.handle_querySubmit_Button();
}


// *** END QUERY STRING PROCESSING *** //




// *** SELECTION MODAL PROCESSING *** //


$("#makeSelections").click( function(event){
  inpho.semantics.handle_querySubmit_Button();
});

// Function adds new element to list and correctly updates hidden field
inpho.semantics.addListItem = function(group, value, label) {
  var field = $("input[type='hidden']", group);
  var initialVal = field.val();

  // if new value is in old value, don't add it
  // TODO: add in some error display?
  var regExPattern = new RegExp("^" + value + "$");
  if (initialVal.match(regExPattern) != null)
    return false;

  // otherwise, add it
  if (initialVal != '')
    field.val(initialVal + "," + value);
  else
    field.val(value);

  // build list item from selected option
  var anchor = "<i class='icon-remove' onclick='return inpho.semantics.removeListItem($(this).parent())'></i> ";
  var li = "<li data-value='" + value + "'>" + anchor + label + "</li>";
  $("ul", group).append( li );
}

inpho.semantics.removeListItem = function(item) {
  // grab the value and remove from hidden field
  var value = $(item).attr('data-value');
  var group = $(item).parents(".group")[0];
  var field = $("input[type='hidden']", group);

  // remove from the hidden field
  var newVal = field.val().split(",");
  newVal.splice(newVal.indexOf(value), 1);
  field.val(newVal.join());

  // delete from the DOM
  $(item).remove();
  inpho.semantics.handle_querySubmit_Button();
}

// Functions to handle button events.
inpho.semantics.program_button = function(group) {
  $("button", group).click( function(event) {
    event.preventDefault();
    var value = $("option:selected",group).val();
    var text = $("option:selected",group).text();
    inpho.semantics.addListItem(group, value, text);
    inpho.semantics.handle_querySubmit_Button();
  });
}



// program the two buttons associated with pull-downs
inpho.semantics.program_button( '#corpora' ); // CORPORA
inpho.semantics.program_button( '#models' ); // MODELS

// PHRASES
$("input", "#phrases").keydown( function(event) {
  if (event.keyCode == 13)
    event.preventDefault();
});
$("input", "#phrases").keyup( function(event) {
  event.preventDefault();
  if (event.keyCode == 13){ // Enter key
    inpho.semantics.addListItem("#phrases", $(this).val(), $(this).val());
    $(this).val('');
    inpho.semantics.handle_querySubmit_Button();
  }
});

$("button", "#phrases").click( function(event) {
  event.preventDefault();
  input = $("input", "#phrases");
  inpho.semantics.addListItem("#phrases", input.val(), input.val());
  $(this).val('');
  inpho.semantics.handle_querySubmit_Button();
});

// SEARCH LIMIT
$("#searchLimit").keydown( function(event){
  if (event.keyCode == 13){
    event.preventDefault();
  }
});


// RESET BUTTON
$("#queryReset").click( function(event) {
  event.preventDefault();
  // clear the hidden fields

  // remove the list items
  var lists = ["#corpora", "#models", "#phrases"];
  for(var i = 0; i < lists.length; i++){
    var ls = $("ul", lists[i]).children("li");
    for(var j = 0; j < ls.length; j++){
      inpho.semantics.removeListItem(ls[j]);
    }
  }
  inpho.semantics.handle_querySubmit_Button();
});


inpho.semantics.queryParametersValid = function(){
  // just check if each hidden field in each group
  // (corpora, models, phrases) has more than one child
  return $("input[type='hidden']", "#corpora").val() !== ""
    &&   $("input[type='hidden']", "#models" ).val() !== ""
    &&   $("input[type='hidden']", "#phrases").val() !== "";
}

// Used to determine if the submit button should be
// disabled or enabled.
inpho.semantics.handle_querySubmit_Button = function(){
  if ( inpho.semantics.queryParametersValid() ){
    $("#querySubmit").removeAttr("disabled");
  } else {
    $("#querySubmit").attr("disabled","disabled");
  }
}
// *** END SELECTION MODAL PROCESSING *** //



// *** EXPORT MODAL POPULATING *** //


inpho.semantics.populate_export_modal = function (elt) {
  // Populate the modal with corpora.
  for (corpus in inpho.semantics.cache["corpora"]) {
    var corpusDescription = inpho.semantics.getCorpusProperty(corpus, "long label");
    $("#exportCorpus").append('<option value="' + corpus + '">' + corpusDescription + '</option>');
  }

  // Populate the modal with models.
  for (model in inpho.semantics.cache["models"]) {
    var modelDescription = inpho.semantics.getModelProperty(model, "long label");
    $("#exportModel").append('<option value="' + model + '">' + modelDescription + '</option>');
  }
}



// *** END EXPORT MODAL POPULATING *** //





// *** EXPORT MODAL PROCESSING *** //

inpho.semantics.exportQuery = function(corpus, model, phrase, width){
  var query = { 'corpus' : corpus,
                'model' : model,
                'phrase' : phrase,
                'matrixWidth' : width };
  $.get("/export", query, 'json')
    .success( function(data) {
    })
    .error( function(error) {
      console.log(error.responseText);
    });
}

$("#exportExportBtn").click( function(event){
  event.preventDefault();
  var corpus = $("#exportCorpus").val();
  var model  = $("#exportModel" ).val();
  var phrase = $("#exportPhrase").val();
  var width  = $("#exportCount" ).val();
  $(".modal-footer", "#exportModal").append("<img src='lib/img/loading.gif' />");
  inpho.semantics.exportQuery(corpus, model, phrase, width);
});

inpho.semantics.exportParametersValid = function(){
  // ensure that a phrase has been entered
  return $("#exportPhrase").val() !== "";
}

// Used to determine if the export button should be
// disabled or enabled.
inpho.semantics.handle_exportSubmit_Button = function(){
  if ( inpho.semantics.exportParametersValid() ){
    $("#querySubmit").removeAttr("disabled");
  } else {
    $("#querySubmit").attr("disabled","disabled");
  }
}


// *** END EXPORT MODAL PROCESSING *** //




// *** DATA RENDERING *** //

/**
   inpho.semantics.renderQueryResult
   Takes an element to populate, a query JSON object containing a
   model, corpus, term, and searchLimit, and the results from the given
   query, and uses all three to generate a pretty looking div displaying
   the data.
*/
inpho.semantics.renderQueryResult = function (elt, query, data) {

  var div = document.createElement('div');
  div.className = "queryResult";

  var corpusDiv = document.createElement('div');
  corpusDiv.className = "queryHeader";
  corpusDiv.innerHTML = inpho.semantics.getCorpusProperty( query.corpus, "short label");
  corpusDiv.style.backgroundColor = inpho.semantics.getCorpusProperty( query.corpus, "backgroundcolor" );
  corpusDiv.style.color = inpho.semantics.getCorpusProperty( query.corpus, "fontcolor" );
  $(div).append( corpusDiv );

  var modelDiv = document.createElement('div');
  modelDiv.className = "queryHeader";
  modelDiv.innerHTML = inpho.semantics.getModelProperty( query.model, "short label" );
  modelDiv.style.backgroundColor = inpho.semantics.getModelProperty( query.model, "backgroundcolor" );
  modelDiv.style.color = inpho.semantics.getModelProperty( query.model, "fontcolor");
  $(div).append( modelDiv );

  var phraseDiv = document.createElement('div');
  phraseDiv.className = "queryHeader";
  phraseDiv.innerHTML = query.phrase;
  phraseDiv.style.backgroundColor = inpho.semantics.getPhraseProperty( query.phrase, "backgroundcolor" );
  phraseDiv.style.color = "#fff"; //inpho.semantics.getPhraseProperty( query.phrase, "color" );
  $(div).append( phraseDiv );

  // print the data in a 2-column table (Phrase, Similarity)
  var table = document.createElement('table');
  $(table).append("<tr><th>Phrase</th>"
                  + "<th>Similarity</th></tr>");

  // for each term in the returned list, append a table row
  for(var i = 0; i < data.length; i++){
    for(term in data[i]){
      var tr = document.createElement('tr');
      tr.setAttribute("data-term", term);
      $(tr).append("<td>" + term + "</td>" +
                   "<td>" + Number(data[i][term]).toPrecision(4) + "</td>");

      // highlight like terms in other columns.
      $(tr).mouseover(function(term){
        return function(event){
          $("tr[data-term='"+term+"']").css("background", "lightgrey");
        }
      }(term));

      // dim when not mouse not hovering above.
      $(tr).mouseout(function(term){
        return function(event){
          $("tr[data-term='"+term+"']").css("background", "white");
        }
      }(term));

      $(table).append(tr);
    }
  }

  $(div).append(table);
  $(elt).append(div);
}


inpho.semantics.renderQueryError = function(elt, query, jqXHR){
  // The responseText will relay the appropriate error message.
  var div = document.createElement('div');
  div.className = "queryResult";

  var corpusDiv = document.createElement('div');
  corpusDiv.className = "queryHeader";
  corpusDiv.innerHTML = inpho.semantics.getCorpusProperty( query.corpus, "short label");
  corpusDiv.style.backgroundColor = inpho.semantics.getCorpusProperty( query.corpus, "backgroundcolor" );
  corpusDiv.style.color = inpho.semantics.getCorpusProperty( query.corpus, "fontcolor" );
  $(div).append( corpusDiv );

  var modelDiv = document.createElement('div');
  modelDiv.className = "queryHeader";
  modelDiv.innerHTML = inpho.semantics.getModelProperty( query.model, "short label" );
  modelDiv.style.backgroundColor = inpho.semantics.getModelProperty( query.model, "backgroundcolor" );
  modelDiv.style.color = inpho.semantics.getModelProperty( query.model, "fontcolor");
  $(div).append( modelDiv );

  var phraseDiv = document.createElement('div');
  phraseDiv.className = "queryHeader";
  phraseDiv.innerHTML = query.phrase;
  phraseDiv.style.backgroundColor = inpho.semantics.getPhraseProperty( query.phrase, "backgroundcolor" );
  phraseDiv.style.color = "#fff"; //inpho.semantics.getPhraseProperty( query.phrase, "color" );
  $(div).append( phraseDiv );


  $(div).append("<div class='alert alert-error'>"+jqXHR.responseText+"</div>");
  $(elt).append(div);
  
  // log error in dev console
  console.log('Error! jqXHR.responseText: ' + jqXHR.responseText)
}

inpho.semantics.load = function(elt) {
  // inpho.semantics.load
  // called on page load to import data from the querystring
  // into page
  params = inpho.semantics.get_params();

  // if there were no parameters, we have nothing to do
  if (!params) return false;

  // iterate over all combinations and build a table in elt
  for(var ci=0; ci < params.corpora.length; ci++) { // For each corpus,
    for(var mi=0; mi < params.models.length; mi++) { // for each model,
      for(var pi=0; pi < params.phrases.length; pi++) { // and for each phrase...
        var corpus = params.corpora[ci];
        var model  = params.models[mi];
        var phrase = params.phrases[pi];

        // only if valid
        if (!(corpus && model && phrase))
          continue;

        // ... construct a query ...
        var query = { 'corpus' : corpus,
                      'model' : model,
                      'phrase' : phrase,
                      'searchLimit' : params.searchLimit };

        // Since this is the first time we're encountering each phrase,
        // add it to the object inpho.semantics.cache and give it
        // a colour.
        var hueCap = 127.0;
        var colorStep = ((hueCap*3.0) / params.phrases.length);
        var colorTotal = colorStep * pi;
        var r = Math.floor((colorTotal % hueCap) + 127);
        var g = Math.floor((((colorTotal / hueCap) * colorStep) % hueCap) + 127);
        var b = Math.floor((((((colorTotal / hueCap) * colorStep) / hueCap) * colorStep) % hueCap) + 127);
        var color = "rgb(" + r + "," + g + "," + b + ")";

        inpho.semantics.cache["phrases"][phrase] = inpho.semantics.cache["phrases"][phrase] || {"backgroundcolor":color};
        
        var successFunction = function(query){
          return function(data){
            inpho.semantics.renderQueryResult(elt, query, data);
          };
        }(query);

        var errorFunction = function(query){
          return function(jqXHR){
            inpho.semantics.renderQueryError(elt, query, jqXHR);
          }          
        }(query);
        
        // ... and send it.
        $.get("/data", query, 'json')
          .success( successFunction )
          .error( errorFunction );
      }
    }
  }
}


// *** END RENDERING *** //





