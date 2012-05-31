#!/usr/bin/python

import inphosemantics
from inphosemantics import inpho
from tornado import ioloop, web


model_instances = {
    ('sep', 'complete', 'beagle', 'environment'):
        inpho.InphoViewer('sep', 'complete', 'beagleenvironment'),
    ('sep', 'complete', 'beagle', 'context'):\
        inpho.InphoViewer('sep', 'complete', 'beaglecontext'),
    ('sep', 'complete', 'beagle', 'order'):\
        inpho.InphoViewer('sep', 'complete', 'beagleorder'),
    ('sep', 'complete', 'beagle', 'composite'):\
        inpho.InphoViewer('sep', 'complete', 'beaglecomposite'),
    ('iep', 'complete', 'beagle', 'environment'):\
        0, # inpho.InphoViewer('iep', 'complete', 'beagleenvironment'),
    ('iep', 'complete', 'beagle', 'context'):\
        0, # inpho.InphoViewer('iep', 'complete', 'beaglecontext'),
    ('iep', 'complete', 'beagle', 'order'):\
        0, # inpho.InphoViewer('iep', 'complete', 'beagleorder'),
    ('iep', 'complete', 'beagle', 'composite'):\
        0 } #inpho.InphoViewer('iep', 'complete', 'beaglecomposite')}
    
stored_results = dict()

class CorpusError(Exception):
    pass

class ModelError(Exception):
    pass

class PhraseError(Exception):
    pass


def get_model(corpus, corpus_param, model, model_param):
    
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
        model_inst = get_model(corpus, corpus_param, 
                               model, model_param)
        try:
            result = model_inst.similar_terms(phrase, True)
        except:
            raise PhraseError('No word in ' + phrase + ' appears in corpus')

        stored_results[
            (corpus, corpus_param, model, model_param, phrase)
            ] = result


    if result[0][0] == phrase:
        result = result[1:n+1]
    else:
        result = result[:n]
            
    result = {'result': 
              [{term: '{0:^.3f}'.format(float(value))} 
               for (term, value) in result]}
    print 'Result', result

    return result



class IndexHandler(web.RequestHandler):

    def get(self):
        self.render('index.html')

    def post(self):

        corpus = self.get_argument('corpus').split('.')[0]
        corpus_param = self.get_argument('corpus').split('.')[1]

        model = self.get_argument('model').split('.')[0]
        model_param = self.get_argument('model').split('.')[1]

        phrase = self.get_argument('phrase')

        searchLimit = int(self.get_argument('searchLimit'))

        try:
            result = get_similarities(corpus, corpus_param, model,
                                      model_param, phrase, searchLimit)
            self.finish(result)
            
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
            self.finish('Something is wrong with the limit.')
        else:
            self.finish('Uncaught error')


if __name__ == "__main__":

    handlers = [(r'/', IndexHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)

    application.listen(9090)
    ioloop.IOLoop.instance().start()

