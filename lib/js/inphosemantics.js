/* inphosemantics.js
 * Controls the rendering of the InPhOSemantics browser.
 *
 */

// 1.0 Namespace Initialization
// 2.0 On Page Ready
// 3.0 Cache Interaction
// 3.1   inpho.semantics.getCorpusProperty
// 3.2   inpho.semantics.getModelProperty
// 3.3   inpho.semantics.getPhraseProperty
// 4.0 Query String Processing
// 4.1   inpho.getParameter
// 4.2   inpho.semantics.get_params
// 5.0 Selection Modal
// 5.1   inpho.semantics.populate_selection_modal
// 5.2   inpho.semantics.addListItem
// 5.3   inpho.semantics.removeListItem
// 5.4   inpho.semantics.program_button
// 5.5   inpho.semantics.queryParamtersValid
// 5.6   inpho.semantics.handle_querySubmit_Button
// 6.0 Export Modal
// 6.1   inpho.semantics.populate_export_modal
// 6.2   inpho.semantics.exportQuery
// 6.3   inpho.semantics.exportParametersValid
// 6.4   inpho.semantics.handle_exportSubmit_Button
// 7.0 Data Rendering
// 7.1   inpho.semantics.renderQueryResult
// 7.2   inpho.semantics.renderQueryError
// 7.3   inpho.semantics.load









//////////////////////////////////////////
////   1.0 Namespace Initialization   ////
//////////////////////////////////////////
var inpho = inpho || {};
inpho.semantics = inpho.semantics || {};
inpho.semantics.cache = {"corpora":{},"models":{},"phrases":{}};










///////////////////////////////
////   2.0 On Page Ready   ////
///////////////////////////////
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











///////////////////////////////////
////   3.0 CACHE INTERACTION   ////
///////////////////////////////////

// 3.1 inpho.semantics.getCorpusProperty
inpho.semantics.getCorpusProperty = function(corpusKey, property){
  return inpho.semantics.cache["corpora"][corpusKey][property];
}

// 3.2 inpho.semantics.getModelProperty
inpho.semantics.getModelProperty = function(modelKey, property){
  return inpho.semantics.cache["models"][modelKey][property];
}

// 3.3 inpho.semantics.getPhraseProperty
inpho.semantics.getPhraseProperty = function(phraseKey, property){
  return inpho.semantics.cache["phrases"][phraseKey][property];
}












/////////////////////////////////////////
////   4.0 QUERY STRING PROCESSING   ////
/////////////////////////////////////////

// 4.1 inpho.getParameter
inpho.getParameter = function(name) {
  // Helper function to get parameters from URL query string
  // Source: http://stackoverflow.com/a/5158301/969863
  var match = RegExp('[?&]' + name + '=([^&]*)')
    .exec(window.location.search);

  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// 4.2 inpho.semantics.get_params
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












/////////////////////////////////
////   5.0 SELECTION MODAL   ////
/////////////////////////////////




$("#makeSelections").click( function(event){
  inpho.semantics.handle_querySubmit_Button();
});





// 5.1 inpho.semantics.populate_selection_modal
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






// 5.2 inpho.semantics.addListItem
// Function adds new element to list and correctly updates hidden field
inpho.semantics.addListItem = function(group, value, label) {
  var field = $("input[type='hidden']", group);
  var initialVal = field.val();

  if (value === '') {
    // don't add it, but don't fail
    return true;
  }

  // if new value is in old value, don't add it
  // TODO: add in some error display?
  var regExPattern = new RegExp("^" + value + "$");
  var vals = initialVal.split(',');
  for(var i = 0; i < vals.length; i++){
    if (vals[i].match(regExPattern) != null)
      return false;
  }

  // otherwise, add it
  if (initialVal != '')
    field.val(initialVal + "," + value);
  else
    field.val(value);

  // build list item from selected option
  var anchor = "<i class='icon-remove' onclick='return inpho.semantics.removeListItem($(this).parent())'></i> ";
  var li = "<li data-value='" + value + "'>" + anchor + label + "</li>";
  $("ul", group).append( li );
  return true;
}





// 5.3 inpho.semantics.removeListItem
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



// 5.4 inpho.semantics.program_button
// Functions to handle button events.
inpho.semantics.program_button = function(group) {
  $("button", group).click( function(event) {
    event.preventDefault();
    var value = $("option:selected",group).val();
    var text = $("option:selected",group).text();
    if(inpho.semantics.addListItem(group, value, text)){
      inpho.semantics.handle_querySubmit_Button();
    } else {
      var error = "<div class='alert alert-error'>" +
        text + " already entered as selection." +
        "<button class='close' data-dismiss='alert'>×</button>" +
        "</div>";
      $(group).append(error);
    }
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
    var val = $(this).val().toLowerCase();
    if(inpho.semantics.addListItem("#phrases", val, val)){
      $(this).val('');
      inpho.semantics.handle_querySubmit_Button();
    } else {
      var error = "<div class='alert alert-error'>" +
        val + " already entered as selection." +
        "<button class='close' data-dismiss='alert'>×</button>" +
        "</div>";
      $("#phrases").append(error);
    }
  }
});




                              
$("button", "#phrases").click( function(event) {
  event.preventDefault();
  input = $("input", "#phrases");
  var val = input.val().toLowerCase();
  console.log(val);
  if(inpho.semantics.addListItem("#phrases", val, val)){
    $(this).val('');
    inpho.semantics.handle_querySubmit_Button();
  } else {
    var error = "<div class='alert alert-error'>" +
      val + " already entered as selection." +
      "<button class='close' data-dismiss='alert'>×</button>" +
      "</div>";
    $("#phrases").append(error);
  }
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





// 5.5 inpho.semantics.queryParamtersValid
inpho.semantics.queryParametersValid = function(){
  // just check if each hidden field in each group
  // (corpora, models, phrases) has more than one child
  return $("input[type='hidden']", "#corpora").val() !== ""
    &&   $("input[type='hidden']", "#models" ).val() !== ""
    &&   $("input[type='hidden']", "#phrases").val() !== "";
}





// 5.6 inpho.semantics.handle_querySubmit_Button
// Used to determine if the submit button should be
// disabled or enabled.
inpho.semantics.handle_querySubmit_Button = function(){
  if ( inpho.semantics.queryParametersValid() ){
    $("#querySubmit").removeAttr("disabled");
  } else {
    $("#querySubmit").attr("disabled","disabled");
  }
}















/////////////////////////////
////  6.0 EXPORT MODAL   ////
/////////////////////////////




// 6.1 inpho.semantics.populate_export_modal
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






// 6.2 inpho.semantics.exportQuery
inpho.semantics.exportQuery = function(corpus, model, phrase, width){
  var query = { 'corpus' : corpus,
                'model' : model,
                'phrase' : phrase,
                'matrixWidth' : width };
  $.get("/export.csv", query, 'json')
    .success( function(data) {
      // this should be.. our .. uh.. url.
      var url = ""//"http://inphodata.cogs.indiana.edu:9090/";

      // build the query string
      var query = "export.csv?"
      query += "corpus=" + corpus;
      query += "&model=" + model;
      query += "&phrase=" + phrase;
      query += "&matrixWidth=" + width;

      // Put them together and whaddya get?
      url += query;
      
      // Remove the loading glyph when results return
      $("img", "#exportModal").remove();
      
      // display the newly fetched results
      $(".modal-footer","#exportModal").append("<a style='float: left' href=" + url + ">Download Matrix</a>");
    })
    .error( function(error) {
      // remove the loading glyph
      $("img", "#exportModal").remove();

      // Show that the result was unfetchable
      var errordiv = "<div class='alert alert-error colspan4'>" + error.responseText + "</div>";
      $(".modal-footer", "#exportModal").append(errordiv);
      console.log(error.responseText);
    });
}

$("#exportExportBtn").click( function(event){
  event.preventDefault();

  // Remove ...
  $("a", ".modal-footer", "#exportModal").remove(); // old result links
  $(".alert", "#exportModal").remove(); // errors


  // loading glyph
  $(".modal-footer", "#exportModal").append("<img src='lib/img/loading.gif' />");

  var corpus = $("#exportCorpus").val();
  var model  = $("#exportModel" ).val();
  var phrase = $("#exportPhrase").val();
  var width  = $("#exportCount" ).val();  

  inpho.semantics.exportQuery(corpus, model, phrase, width);
});





// 6.3 inpho.semantics.exportParametersValid
inpho.semantics.exportParametersValid = function(){
  // ensure that a phrase has been entered
  return $("#exportPhrase").val() !== "" && $("#exportCount").val() !== "";
}




// 6.4 inpho.semantics.handle_exportSubmit_Button
// Used to determine if the export button should be
// disabled or enabled.
inpho.semantics.handle_exportSubmit_Button = function(){
  if ( inpho.semantics.exportParametersValid() ){
    $("#exportExportBtn").removeAttr("disabled");
  } else {
    $("#exportExportBtn").attr("disabled","disabled");
  }
}














////////////////////////////////
////   7.0 DATA RENDERING   ////
////////////////////////////////

// 7.1 inpho.semantics.renderQueryPanel
inpho.semantics.renderQueryPanel = function(elt, query){
  var queryPanel = document.createElement('div');
  queryPanel.className = "queryPanel";

  var corpusDiv = document.createElement('div');
  corpusDiv.className = "queryHeader";
  corpusDiv.innerHTML = inpho.semantics.getCorpusProperty( query.corpus, "short label");
  corpusDiv.style.backgroundColor = inpho.semantics.getCorpusProperty( query.corpus, "backgroundcolor" );
  corpusDiv.style.color = inpho.semantics.getCorpusProperty( query.corpus, "fontcolor" );
  $(queryPanel).append( corpusDiv );

  var modelDiv = document.createElement('div');
  modelDiv.className = "queryHeader";
  modelDiv.innerHTML = inpho.semantics.getModelProperty( query.model, "short label" );
  modelDiv.style.backgroundColor = inpho.semantics.getModelProperty( query.model, "backgroundcolor" );
  modelDiv.style.color = inpho.semantics.getModelProperty( query.model, "fontcolor");
  $(queryPanel).append( modelDiv );

  var phraseDiv = document.createElement('div');
  phraseDiv.className = "queryHeader";
  phraseDiv.innerHTML = query.phrase;
  phraseDiv.style.backgroundColor = inpho.semantics.getPhraseProperty( query.phrase, "backgroundcolor" );
  phraseDiv.style.color = "#fff"; //inpho.semantics.getPhraseProperty( query.phrase, "color" );
  $(queryPanel).append( phraseDiv );

  var contentDiv = document.createElement('div');
  contentDiv.className = "queryContent";
  $( contentDiv ).append("<img src='lib/img/loading.gif' />");
  
  $(queryPanel).append( contentDiv )
  $(elt).append( queryPanel );


  return contentDiv;
}

// 7.3 inpho.semantics.load
inpho.semantics.load = function(elt) {
  // inpho.semantics.load
  // called on page load to import data from the querystring
  // into page
  params = inpho.semantics.get_params();

  // if there were no parameters, we have nothing to do
  if (!params) return false;

  // used for colour-processing below.
  var hueBoost = 64;
  var hueCap = 128;
  var colorTotal = hueCap * 3.0;
  var colorStep = colorTotal / params.phrases.length;
  var r = 0;
  var g = 0;
  var b = 0;

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



        if ( !inpho.semantics.cache["phrases"][phrase] ){

          // Since this is the first time we're encountering each phrase,
          // add it to the object inpho.semantics.cache and give it
          // a (bright -- +64) colour.
          r += colorStep;
          if (r > hueCap) {
            r %= hueCap;
            g += colorStep;
            if ( g > hueCap){
              g %= hueCap;
              b += colorStep;
              if (b > hueCap){
                b %= hueCap;
              }
            }
          }

          var color = "rgb(" + Math.floor(r + hueBoost) + "," + Math.floor(g + hueBoost) + "," + Math.floor(b + hueBoost) + ")";
          inpho.semantics.cache["phrases"][phrase] = inpho.semantics.cache["phrases"][phrase] || {"backgroundcolor":color};
        }
        

        var contentDiv = inpho.semantics.renderQueryPanel(elt, query);


        
        var successFunction = function(elt){
          return function(data){
            
            $("img", elt).remove(); // remove the loading glpyh
            
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
                    $("tr[data-term='"+term+"']").css("background", "#9CF");
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
            
            $(elt).append(table);
          };
        }(contentDiv);
        

        var errorFunction = function(elt){
          return function(jqXHR){

            $("img", elt).remove() // remove the loading glyph

            // The responseText will relay the appropriate error message.
            $(elt).append("<div class='alert alert-error'>"+jqXHR.responseText+"</div>");
            
            // log error in dev console
            console.log('Error! jqXHR.responseText: ' + jqXHR.responseText);
          }
        }(contentDiv);
        
        
        // ... and send it.
        $.get("/data", query, 'json')
          .success( successFunction )
          .error( errorFunction );
      }
    }
  }
}







