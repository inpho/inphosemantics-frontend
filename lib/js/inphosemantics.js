function post(url, data, callback) {
  $.ajax({
    type: "POST",
    url: url,
    data: data,
    dataType: 'json',
    success: callback
  });
}

function main() {

  // [SRW: 2012/4/27]: For now we pull the available corpora
  // and available models from a local directory.
  // in the future, we will query for them when the page is loaded.
  var jsondir = "../../data/inphosemantics-directory.json";
  $.getJSON(jsondir, function(json) {

    // hides 'Make Selections' modal on load
    $("#selectionModal").modal({
      show: false
    });

    // Shave off the cruft.
    var response = json.responseData.results[0];

    var corporaArray = response['corpora'];
    var modelsArray = [];
    var modelsModalData = {}; // used to populate 'Add Model' modal


    // returns a corpus' dictionary key
    function getCorpusKey(corpus) {
      return Object.keys(corpus)[0];
    }

    // returns a model's dictionary key
    function getModelKey(model) {
      return Object.keys(model)[0];
    }

    // returns a corpus' 'long label' given its dictionary key
    function getCorpusLongLabel(corpusKey) {
      for (var i=0; i<corporaArray.length; i++) {
        var keys = Object.keys(corporaArray[i]);
        if (keys.indexOf(corpusKey) != -1) {
          return corporaArray[i][corpusKey]['long label'];
        }
      }
      alert('Corpus key not found.')
    }

    // returns a model's 'long label' given its dictionary key
    function getModelLongLabel(modelKey) {
      for (var i=0; i<modelsArray.length; i++) {
        var keys = Object.keys(modelsArray[i]);
        if (keys.indexOf(modelKey) != -1) {
          return modelsArray[i][modelKey]['long label'];
        }
      }
      alert('Model key not found.')
    }


    // Populate the 'Add Corpus' modal.
    for (var i = 0; i < corporaArray.length; i++) {
      var corpus = corporaArray[i];
      var corpusKey = getCorpusKey(corpus);
      $("#corporaSelect").append("<option value='"+corpusKey+"'>"+getCorpusLongLabel(corpusKey)+"</option>");

      // And populate modelsArray/modelsModalData for later.
      var models = corpus[corpusKey]['models'];
      for (var j = 0; j < models.length; j++) {
        var model = models[j];
        modelsArray.push(model);
        modelsModalData[(Object.keys(model)[0])] = model;
      }
    }


    // Populate the 'Add Model' modal.
    for (key in modelsModalData){
      var modelLabel = getModelLongLabel(key);
      var option = "<option value='"+key+"'>"+modelLabel+"</option>";
      $("#modelsSelect").append(option);
    }


    // adds the selected corpus to the URL
    $("#corporaSubmit").click(function(event) {
      event.preventDefault();
      var selectedCorpus = $("#corporaSelect").val();
      var selectedCorpora = convertHashToObject(window.location.hash)['corpora'];

      // if hashObject does not already contain the selected corpus
      if (selectedCorpora.indexOf(selectedCorpus) == -1) {
        addCorpus(selectedCorpus);

        var anchor = "<a id=\'" + selectedCorpus + "\'class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
        var listItem = "<li id=\'" + selectedCorpus + "li\'>" + getCorpusLongLabel(selectedCorpus) + anchor + "</li>";

        $("#currentCorpora").append(listItem);

        document.getElementById(selectedCorpus).onclick = function(){
          return function(){
            removeCorpus(selectedCorpus);
            var li = document.getElementById(selectedCorpus + "li");
            $(li).remove();
          };
        }();

      }
    });

    // adds the selected model to the URL
    $("#modelsSubmit").click(function(event) {
      event.preventDefault();
      var selectedModel = $("#modelsSelect").val();
      var hashModels = convertHashToObject(window.location.hash)['models'];

      // if hashObject does not already contain the selected model
      if (hashModels.indexOf(selectedModel) == -1) {
        addModel(selectedModel);

        var anchor = "<a id=\'" + selectedModel + "\' class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
        var listItem = "<li id=\'" + selectedModel + "li\'>" + getModelLongLabel(selectedModel) + anchor + "</li>";

        $("#currentModels").append(listItem);

        document.getElementById(selectedModel).onclick = function(){
          return function(){
            removeModel(selectedModel);
            var li = document.getElementById(selectedModel + "li");
            $(li).remove();
          };
        }();

      }
    });

    // adds the searched phrase to the URL
    $("#search").submit(function(event) {
      event.preventDefault();
      var searchedPhrase = $("#searchTerm").val();
      var searchedPhrases = convertHashToObject(window.location.hash)['phrases'];

      // if hashObject does not already contain the search phrase.
      if (searchedPhrases.indexOf(searchedPhrase) == -1) {
        addPhrase(searchedPhrase);

        var anchor = "<a id=\'" + searchedPhrase +"\'class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
        var listItem = "<li id=\'" + searchedPhrase + "li\'>" + searchedPhrase + anchor +"</li>";

        $("#currentPhrases").append(listItem);

        document.getElementById(searchedPhrase).onclick = function(){
          return function(){
            removePhrase(searchedPhrase);
            var li = document.getElementById(searchedPhrase + "li");
            $(li).remove();
          };
        }();

      }
      this.reset();
    });




    // ensures that "current selection" data persists on refresh
    // TODO: implement 'long labels'
    var hash = window.location.hash;
    var obj = convertHashToObject(hash);

    var hashCorpora = obj['corpora'];
    if (hashCorpora){
      for (var i=0; i<hashCorpora.length; i++) {
        $("#currentCorpora").append("<li>"+getCorpusLongLabel(hashCorpora[i])+" <a class='close' style='float: none; vertical-align: text-bottom;'>&times;</a></li>");
      }
    }

    var hashModels = obj['models'];
    if (hashModels){
      for (var i=0; i<hashModels.length; i++) {
        $("#currentModels").append("<li>"+getModelLongLabel(hashModels[i])+" <a class='close' style='float: none; vertical-align: text-bottom;'>&times;</a></li>");
      }
    }

    var hashPhrases = obj['phrases'];
    if (hashPhrases){
      for (var i=0; i<hashPhrases.length; i++) {
        $("#currentPhrases").append("<li>"+hashPhrases[i]+" <a class='close' style='float: none; vertical-align: text-bottom;'>&times;</a></li>");
      }
    }

    function renderTable(corpora, models, phrases) {
      $("#root").css("display", "table");

      for (var i=0; i<corpora.length; i++) {
        var corpus = corpora[i];
        $("#root > tbody > tr").append(
          "<td><table class='table' id='"+corpus+"'><thead><tr><th colspan='"+models.length+"' style='text-align: center;'>"+getCorpusLongLabel(corpus)+"</th></tr></thead><tbody><tr></tr></tbody></table></td>"
        );
      }

      $("#root > tbody > tr > td > table > tbody > tr").each(function() {
        for (var i=0; i<models.length; i++) {
          var model = models[i];
          $(this).append(
            "<td><table class='table' id='"+$(this).closest("table").attr("id")+":"+model+"'><thead><tr><th colspan='"+phrases.length+"' style='text-align: center;'>"+getModelLongLabel(model)+"</th></tr></thead><tbody><tr></tr></tbody></table></td>"
          );
        }
      });

      $("#root > tbody > tr > td > table > tbody > tr > td > table > tbody > tr").each(function() {
        for (var i=0; i<phrases.length; i++) {
          var phrase = phrases[i];
          $(this).append(
            "<td><table class='table' id='"+$(this).closest("table").attr("id")+":"+phrase+"'><thead><tr><th colspan='2' style='text-align: center;'>"+phrase+"</th></tr><tr><th>Phrase</th><th>Similarity</th></tr></thead><tbody></tbody></table></td>"
          );
        }
      });
    }

    function selectColumn(corpus, model, phrase){
      var id = corpus+":"+model+":"+phrase;
      var elem = document.getElementById(id);
      return elem;
    }

    /** RENDERCOLUMN : Array<Pair> data, DOMobject element
     * populates a dom object [tbody] with table rows and table data
     * from the data array received.
     **/
    function renderColumn(data, element){
      // for each pair in the dataArray
      for(var i = 0; i < data.length; i++){
        // for each (only one) key in the object pair
        for(key in data[i]){
          // append this data to the parentObject as a related term and similarity
          $(element).append("<tr><td>"+key+"</td><td>"+data[i][key]+"</td></tr>");
        }
      }
    }

    $("#querySubmit").click(function(){
      $("#root tr").empty();
      var hashObj = convertHashToObject( window.location.hash );
      var corpora = hashObj['corpora'];
      var models = hashObj['models'];
      var phrases = hashObj['phrases'];

      // draw the empty table
      renderTable(corpora, models, phrases);

      // create a request for each combination
      for(var ci = 0; ci < corpora.length; ci++){
        for(var mi = 0; mi < models.length; mi++){
          for(var pi = 0; pi < phrases.length; pi++){
            // construct request data
            var requestData = {
              "corpus":corpora[ci],
              "model":models[mi],
              "phrase":phrases[pi]
            };

            // Determine where to render the response data.
            var parentColumn = selectColumn(corpora[ci], models[mi], phrases[pi]);

            // Construct a callback function for this column element.
            var callback = function(parent){
              return function(response){

                // If text comes back ...
                if(response){
                  // parse it into an array and render the data.
                  var data = response['result'];
                  renderColumn(data, parent);
                }
              };
            }(parentColumn);

            // Send the request.
            post("/", requestData, callback);
          }
        }
      }
      $("#selectionModal").modal('hide');
    });

    // TODO: very crudely implemented
    $("#queryReset").click(function(){
      window.location.hash = "";
      window.location.reload();
    });
  });
}

$(document).ready(function(){
  main();
});

