/* inphosemantics.js
 * Controls the rendering of the InPhOSemantics browser.
 * */

// namespace initialization
var inpho = inpho || {};
inpho.semantics = inpho.semantics || {};

// Functions to handle model selection from form and from URL

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

