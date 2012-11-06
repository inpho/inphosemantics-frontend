#!/usr/bin/python
import json
from inphosemantics import *
from datetime import datetime # Used to show when server comes online.
from tornado import ioloop, web # Web Serving.

stored_viewers = dict()

#########################
##  Exception Classes  ##
#########################


class CorpusError(Exception):
    pass
class ModelError(Exception):
    pass
class PhraseError(Exception):
    pass
class LimitError(Exception):
    pass
class MatrixWidthError(Exception):
    pass


#######################
##  Tornado Methods  ##
#######################


def choose_viewer(corpus, corpus_param, model, model_param):

    ## First try to grab the expected viewer by constructing
    ## a String viewer label.
    viewer_label = corpus + '-' + model + '-' + model_param
    
    ## If we've already created and stored this viewer, fetch it.
    if stored_viewers.has_key(viewer_label):
        v = stored_viewers[viewer_label]
        
    ## Else try to grab it.
    else:
        try:
            v = viewer(viewer_label)
            stored_viewers[viewer_label] = v
        ## If it doesn't exist, throw an exception.
        except Exception:
            raise ModelError(viewer_label + ' is not available')

    return v



## Handles grabbing the appropriate 
def get_similarities(corpus, corpus_param, model, model_param, phrase, n):

    viewer = choose_viewer(corpus, corpus_param, model, model_param)
    try:
        result = viewer.similar_terms(phrase, filter_nan=True)
        if not result:
            raise PhraseError('Phrase \'' + phrase + '\' returned no similarities.')
    except:
        raise PhraseError('Phrase \'' + phrase + '\' is not available.')

    if result[0][0] == phrase:
        result = result[1:n+1]
    else:
        result = result[:n]
            
    result = [{term: '{0:^.3f}'.format(float(value))} 
                 for (term, value) in result]
    print 'Result', result

    return result




##############################
##  Tornado Helper Classes  ##
##############################


class IndexHandler(web.RequestHandler):

    def get(self):
        ## Serve the homepage.
        self.render('index.html')



class DataHandler(web.RequestHandler):
    
    def get(self):
        ## Get the parameters.
        corpus       = self.get_argument('corpus').split('.')[0]
        corpus_param = self.get_argument('corpus').split('.')[1]
        model_arg    = self.get_argument('model').split('.')
        model        = model_arg[0]
        model_param  = model_arg[1] if len(model_arg) == 2 else ""
        phrase       = self.get_argument('phrase')
        searchLimit  = int(self.get_argument('searchLimit'))

        try:
            #stored_viewers = dict()
            ## Compute the provided terms similarities.
            result = get_similarities(corpus, corpus_param, model,
                                      model_param, phrase, searchLimit)
            self.set_header("Content-Type", "application/json; charset=UTF-8")
            self.write(json.dumps(result))
            ## Reset the cached viewers to reduce the memory footprint.
            ## (Assuming that Python's garbage collection flushes unreferenced objects).
            stored_viewers = None
            
        ## Throw appropriate error response.
        except CorpusError:
            self.send_error( reason = 'corpus')
        except ModelError:
            self.send_error( reason = 'model')
        except PhraseError:
            self.send_error( reason = 'phrase')
        except LimitError:
            self.send_error( reason = 'limit')
        except:
            self.send_error()

    ## Handles pretty printing of errors.
    def write_error(self, status_code, reason = None, **kwargs):

        if reason == 'corpus':
            self.finish('Corpus not available')
        elif reason == 'model':
            self.finish('Model not available')
        elif reason == 'phrase':
            self.finish('Phrase not available')
        elif reason == 'limit':
            self.finish('Search result limit problematic.')
        else:
            self.finish('Uncaught error')

            

class ExportHandler(web.RequestHandler):

    def get(self):
        ## Get the parameters.
        corpus    = self.get_argument('corpus').split('.')[0]
        param     = self.get_argument('corpus').split('.')[1]
        modelArgs = self.get_argument('model').split('.')
        model     = modelArgs[0] + modelArgs[1]
        phrase    = self.get_argument('phrase')
        width     = int(self.get_argument('matrixWidth'))

        try:
            ## (BackEnd) Request file in Word2Word Comma Separated Value format.
            result = inpho.get_Word2Word_csv(corpus      = corpus,
                                             corpusParam = param,
                                             model       = model,
                                             phrase      = phrase,
                                             matrixWidth = width)

            ## Write the result back to the requester.
            self.set_header("Content-Type", "application/json; charset=UTF-8")
            self.write(json.dumps(result))
            
        ## Throw appropriate error response.
        except CorpusError:
            self.send_error( reason = 'corpus')
        except ModelError:
            self.send_error( reason = 'model')
        except PhraseError:
            self.send_error( reason = 'phrase')
        except MatrixWidthError:
            self.send_error( reason = 'matrixWidth')
            
    def write_error(self, status_code, reason = None, **kwargs):

        if reason == 'corpus':
            self.finish('Corpus not available.')
        elif reason == 'model':
            self.finish('Model not available.')
        elif reason == 'phrase':
            self.finish('Phrase not available.')
        elif reason == 'matrixWidth':
            self.finish('Matrix Width Error.')
        else:
            self.finish('Uncaught error')

############
##  MAIN  ##
############
            

if __name__ == "__main__":

    handlers = [(r'/', IndexHandler),
                (r'/data', DataHandler),
                (r'/export.csv', ExportHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)
    port = 9000
    application.listen(port)
    print "\n%s" % datetime.now()
    print "Inphosemantics Frontend @ http://localhost:%d\n" % port
    ioloop.IOLoop.instance().start()

