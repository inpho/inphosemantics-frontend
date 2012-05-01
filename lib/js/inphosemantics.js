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

        var modelsArray = [];
        // used to populate 'Add Model' select
        var modelsModalData = {};

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
        var corporaArray = response['corpora'];
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

                document.getElementById(selectedCorpus).onclick = function(corpus){
                    return function(){
                        removeCorpus(corpus);
                        var li = document.getElementById(corpus + "li");
                        $(li).remove();
                    };
                }(selectedCorpus);

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

                document.getElementById(selectedModel).onclick = function(model){
                    return function(){
                        removeModel(model);
                        var li = document.getElementById(model + "li");
                        $(li).remove();
                    };
                }(selectedModel);

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

                document.getElementById(searchedPhrase).onclick = function(phrase){
                    return function(){
                        removePhrase(phrase);
                        var li = document.getElementById(phrase + "li");
                        $(li).remove();
                    };
                }(searchedPhrase);

            }
            this.reset();
        });




        // ensures that "current selection" data persists on refresh
        // TODO: implement 'long labels'
        var hash = window.location.hash;
        var obj = convertHashToObject(hash);

        var hashCorpora = obj['corpora'];
        if (hashCorpora){
            for (var i = 0; i < hashCorpora.length; i++) {
                var corpus = hashCorpora[i];
                var anchor = "<a id=\'" + corpus + "\'class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
                var listItem = "<li id=\'" + corpus + "li\'>" + getCorpusLongLabel(corpus) + anchor + "</li>";
                
                $("#currentCorpora").append(listItem);
                
                document.getElementById(corpus).onclick = function(corpus){
                    return function(){
                        removeCorpus(corpus);
                        var li = document.getElementById(corpus + "li");
                        $(li).remove();
                    };
                }(corpus);                
            }
        }

        var hashModels = obj['models'];
        if (hashModels){
            for (var i = 0; i < hashModels.length; i++) {
                var model = hashModels[i];
                var anchor = "<a id=\'" + model + "\' class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
                var listItem = "<li id=\'" + model + "li\'>" + getModelLongLabel(model) + anchor + "</li>";

                $("#currentModels").append(listItem);

                document.getElementById(model).onclick = function(model){
                    return function(){
                        removeModel(model);
                        var li = document.getElementById(model + "li");
                        $(li).remove();
                    };
                }(model);
            }
        }

        var hashPhrases = obj['phrases'];
        if (hashPhrases){
            for (var i=0; i<hashPhrases.length; i++) {
                var phrase = hashPhrases[i];
                var anchor = "<a id=\'" + phrase +"\'class='close' style='float: none; vertical-align: text-bottom;'>&times;</a>";
                var listItem = "<li id=\'" + phrase + "li\'>" + phrase + anchor +"</li>";

                $("#currentPhrases").append(listItem);
                
                document.getElementById(phrase).onclick = function(phrase){
                    return function(){
                        removePhrase(phrase);
                        var li = document.getElementById(phrase + "li");
                        $(li).remove();
                    };
                }(phrase);

            }
        }





        function renderTable(corpora, models, phrases) {
            // display "root" table
            $("#root").css("display", "table");

            // render corpora
            for (var i=0; i<corpora.length; i++) {
                var corpus = corpora[i];
                $("#root > tbody > tr").append(
                    "<td><table class='table corpus' id='"+corpus+"'><thead><tr><th colspan='"+models.length+"' style='text-align: center;'>"+getCorpusLongLabel(corpus)+"</th></tr></thead><tbody><tr></tr></tbody></table></td>"
                );
            }

            // render models
            $("#root > tbody > tr > td > table > tbody > tr").each(function() {
                for (var i=0; i<models.length; i++) {
                    var model = models[i];
                    $(this).append(
                        "<td><table class='table model' id='"+$(this).closest("table").attr("id")+":"+model+"'><thead><tr><th colspan='"+phrases.length+"' style='text-align: center;'>"+getModelLongLabel(model)+"</th></tr></thead><tbody><tr></tr></tbody></table></td>"
                    );
                }
            });

            // render phrases
            $("#root > tbody > tr > td > table > tbody > tr > td > table > tbody > tr").each(function() {
                for (var i=0; i<phrases.length; i++) {
                    var phrase = phrases[i];
                    $(this).append(
                        "<td><table class='table phrase' id='"+$(this).closest("table").attr("id")+":"+phrase+"'><thead><tr><th colspan='2' style='text-align: center;'>"+phrase+"</th></tr></thead><tbody></tbody></table></td>"
                    );
                }
            });
        }

        function selectColumn(corpus, model, phrase){
            var id = corpus+":"+model+":"+phrase;
            var elem = document.getElementById(id);
            return elem;
        }


        // This handles the event in which the "Submit Query" button
        // displayed on the bottom of the Selections modal is clicked.
        // It handles constructing requests for data and rendering
        // received data.
        $("#querySubmit").click(function(){
            $("#root tr").empty();
            var hashObj = convertHashToObject( window.location.hash );
            var corpora = hashObj['corpora'];
            var models = hashObj['models'];
            var phrases = hashObj['phrases'];

            // draw the table structure ( Corpora / Models / Phrases )
            renderTable(corpora, models, phrases);

            // for each combination of corpus / model / phrase
            for(var ci = 0; ci < corpora.length; ci++){
                for(var mi = 0; mi < models.length; mi++){
                    for(var pi = 0; pi < phrases.length; pi++){
                        // construct a request
                        var requestData = {
                            "corpus":corpora[ci],
                            "model":models[mi],
                            "phrase":phrases[pi]
                        };

                        // Determine where to render the response.
                        var parentColumn = selectColumn(corpora[ci], models[mi], phrases[pi]);

                        // Construct a callback function, to handle rendering the data.
                        var successCallBack = function(parentElement){
                            return function(response){
                                if(response){
                                    // If JSON comes back, parese it into an array and render
                                    // the data in two columns, Phrase and Similarity.
                                    $(parentElement).append("<tr><th style='text-align: center;'>Phrase</th>"+
                                                            "<th style='text-align: center;'>Similarity</th></tr>");
                                    var data = response['result'];
                                    for(var i = 0; i < data.length; i++){
                                        for(key in data[i]){
                                            // append this data to the parentObject as a related term and similarity
                                            var entry = "<tr><td style='text-align: center;'>" + key + "</td>"
                                                + "<td style='text-align: center;'>"+data[i][key]+"</td></tr>";
                                            $(parentElement).append(entry);
                                        }
                                    }
                                }
                            };
                        }(parentColumn);


                        // In the event that the corpus, model or phrase is not
                        // available, the responseText will be respectively
                        // 'Corpus not available', 'Model not available', and
                        // 'Phrase not available'.
                        var errorCallBack = function(parentElement){
                            return function(jqXHR, textStatus, errorThrown){
                                var div = '<div class="alert alert-error">' + jqXHR.responseText + '</div>'
                                $(parentElement).append(div);
                                console.log('Error! jqXHR.responseText: '
                                            + jqXHR.responseText)

                            };
                        }(parentColumn);

                        // Send the request.
                        $.ajax({
                            type: "POST",
                            url: "/",
                            data: requestData,
                            dataType: 'json',
                            success: successCallBack,
                            error: errorCallBack
                        });

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

