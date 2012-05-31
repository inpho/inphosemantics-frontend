/**
 * Our JSON requests will be in the following form:
 * {
 *   "corpora" : [<String>, ...],
 *   "models" : [<String>, ...],
 *   "phrases" : [<String>, ...]
 * }
 */

function removeElementFromArray(lmnt, array){
  for(var i = 0; i < array.length; i++){
    if (lmnt === array[i]){
      if( i === 0 ){
        array.splice(0, 1);
      } else {
        array.splice(i, i);
      }
      return array;
    }
  }
  return array;
}


function removeCorpus(corpus){
  var hashObj = convertHashToObject(window.location.hash);
  hashObj["corpora"] = removeElementFromArray(corpus, hashObj["corpora"]);
  window.location.hash = convertObjectToHash(hashObj);
}

function removeModel(model){
  var hashObj = convertHashToObject(window.location.hash);
  hashObj["models"] = removeElementFromArray(model, hashObj["models"]);
  window.location.hash = convertObjectToHash(hashObj);
}

function removePhrase(phrase){
    console.log("removing " + phrase);
  var hashObj = convertHashToObject(window.location.hash);
  hashObj["phrases"] = removeElementFromArray(phrase, hashObj["phrases"]);
  window.location.hash = convertObjectToHash(hashObj);
}


function addCorpus(corpusStr){
  var obj = convertHashToObject(window.location.hash);
  if (obj["corpora"]){
    obj["corpora"].push(corpusStr);
  } else {
    obj["corpora"] = [corpusStr];
  }
  // !!! But does not give us to difference,
  // as means to remove graphical components.
  window.location.hash = convertObjectToHash(obj);
}

function addModel(modelStr){
  var obj = convertHashToObject(window.location.hash);
  if (obj["models"]){
    obj["models"].push(modelStr);
  } else {
    obj["models"] = [modelStr];
  }
  // !!! But does not give us to difference,
  // as means to remove graphical components.
  window.location.hash = convertObjectToHash(obj);
}

function addPhrase(phraseStr){
  var obj = convertHashToObject(window.location.hash);
  if (obj["phrases"]){
    obj["phrases"].push(phraseStr);
  } else {
    obj["phrases"] = [phraseStr];
  }
  window.location.hash = convertObjectToHash(obj);
}

function setSearchLimit(searchLimit){
  var hashObj = convertHashToObject(window.location.hash);
  hashObj["searchLimit"] = searchLimit;
  window.location.hash = convertObjectToHash(hashObj);
}

/**
 * convertHashToObject takes a string representing
 * a URL's hash data and attempts to convert it into
 * an object.
 */
var convertHashToObject = function(str){
  //console.log("Objectifying: " + str);
  if (str){
    if(str.charAt(0) === "#"){
      str = str.substring(1);
    }
    return JSON.parse(decodeURI(str));
  }
  return {
    "corpora" : [],
    "models"  : [],
    "phrases" : [],
    "searchLimit" : 20
  };
}


/*
 * convertObjectToHash takes an object representing
 * a collection of query parameters and lops them into
 * a string which is acceptable for use as a URL's hash.
 */
var convertObjectToHash = function(obj){
  if(obj ){
    //console.log("Hashing: " + JSON.stringify(obj));
    return encodeURI(JSON.stringify(obj));
  }
  return "";
}