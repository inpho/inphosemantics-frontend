#!/usr/bin/python
import json
from inphosemantics import *
from datetime import datetime # Used to show when server comes online.
from tornado import ioloop, web # Web Serving.



stored_results = dict()
exportQueryResults = dict()
model_instance = dict()

model_instances = {
    ('sep', 'complete', 'beagle', 'environment'):
        viewer('sep-beagle-environment'),
#        inpho.InphoViewer('sep', 'complete', 'beagleenvironment'),
    ('sep', 'complete', 'beagle', 'context'):
        viewer('sep-beagle-context'),
#        inpho.InphoViewer('sep', 'complete', 'beaglecontext'),
    ('sep', 'complete', 'beagle', 'order'):
        viewer('sep-beagle-order'),
#        inpho.InphoViewer('sep', 'complete', 'beagleorder'),
    ('sep', 'complete', 'beagle', 'composite'):
        viewer('sep-beagle-composite')
#        inpho.InphoViewer('sep', 'complete', 'beaglecomposite'),
    }




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
    
    try:
        return model_instances[(corpus, corpus_param, 
                                model, model_param)]
    except KeyError:

        corpora = [(c, cp) for (c, cp, m, mp) in model_instances.keys()]
        models = [(m, mp) for (c, cp, m, mp) in model_instances.keys()]

        if (corpus, corpus_param) not in corpora:
            raise CorpusError(corpus + ' is not available')
        if (model, model_param) not in models:
            raise ModelError(model + ' is not available')



def get_similarities(corpus, corpus_param, model, model_param, 
                     phrase, n):

    if (corpus, corpus_param, model, model_param, phrase)\
            in stored_results:
        print 'Found stored result'
        result = stored_results[(corpus, corpus_param, model,
                                 model_param, phrase)]

    else:
        viewer = choose_viewer(corpus, corpus_param, model, model_param)
        try:
            result = viewer.similar_terms(phrase, filter_nan=True)
            if not result:
                raise PhraseError('Phrase \'' + phrase + '\' returned no similarities.')
        except:
            raise PhraseError('Phrase \'' + phrase + '\' is not available.')

        stored_results[
            (corpus, corpus_param, model, model_param, phrase)
            ] = result


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
        self.render('index.html')


class DataHandler(web.RequestHandler):
    
    def get(self):

        corpus = self.get_argument('corpus').split('.')[0]
        corpus_param = self.get_argument('corpus').split('.')[1]

        model_arg = self.get_argument('model').split('.')
        model = model_arg[0]
        model_param = model_arg[1] if len(model_arg) == 2 else ""

        phrase = self.get_argument('phrase')

        searchLimit = int(self.get_argument('searchLimit'))

        try:
            result = get_similarities(corpus, corpus_param, model,
                                      model_param, phrase, searchLimit)
            self.write(json.dumps(result))
            self.set_header("Content-Type", "application/json; charset=UTF-8")
            
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

        ## fetch the parameters
        corpus    = self.get_argument('corpus').split('.')[0]
        param     = self.get_argument('corpus').split('.')[1]
        modelArgs = self.get_argument('model').split('.')
        model     = modelArgs[0] + modelArgs[1]
        phrase    = self.get_argument('phrase')
        width     = int(self.get_argument('matrixWidth'))


        ## See if the result is already cached
        query = (corpus, param, model, phrase, width)
        if query in exportQueryResults:

            print 'Found stored Export result'
            result = exportQueryResults[query]

            ## Write the result back to the requester
            self.write(json.dumps(result))
            self.set_header("Content-Type", "application/json' charset=UTF-8")
            
        # Otherwise, actually request the data
        else:
            try:

                ## Perform backend work
                result = inpho.get_Word2Word_csv(corpus      = corpus,
                                                 corpusParam = param,
                                                 model       = model,
                                                 phrase      = phrase,
                                                 matrixWidth = width)

                ## Save our find for future adventurers
                exportQueryResults[query] = result

                ## Write the result back to the requester
                self.write(json.dumps(result))
                self.set_header("Content-Type", "application/json; charset=UTF-8")

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

