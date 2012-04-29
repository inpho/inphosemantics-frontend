#!/usr/bin/python

from tornado import ioloop, web
from inphosemantics import Model

model_instances = {
    ('sep', 'complete', 'beagle', 'environment'):\
        Model('sep','complete','beagle','environment'),
    ('sep', 'complete', 'beagle', 'context'):\
        Model('sep','complete','beagle','context'),
    ('sep', 'complete', 'beagle', 'order'):\
        Model('sep','complete','beagle','order'),
    ('sep', 'complete', 'beagle', 'composite'):\
        Model('sep','complete','beagle','composite'),
    ('iep', 'complete', 'beagle', 'environment'):\
        Model('iep','complete','beagle','environment'),
    ('iep', 'complete', 'beagle', 'context'):\
        Model('iep','complete','beagle','context'),
    ('iep', 'complete', 'beagle', 'order'):\
        Model('iep','complete','beagle','order'),
    ('iep', 'complete', 'beagle', 'composite'):\
        Model('iep','complete','beagle','composite')}
    
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
        print 'Corpora', corpora
        models = [(m, mp) for (c, cp, m, mp) in model_instances.keys()]
        print 'Models', models

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
            result = model_inst.similar(phrase)
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
        n = 20

        try:
            result = get_similarities(corpus, corpus_param, model,
                                      model_param, phrase, n)
            self.finish(result)
            
        except CorpusError:
            self.send_error( reason = 'corpus')
       
        except ModelError:
            self.send_error( reason = 'model')
        
        except PhraseError:
            self.send_error( reason = 'phrase')


    def write_error(self, status_code, reason = None, **kwargs):

        if reason == 'corpus':
            self.finish('Corpus not available')
        elif reason == 'model':
            self.finish('Model not available')
        elif reason == 'phrase':
            self.finish('Phrase not available')
        else:
            self.finish('Uncaught error')


if __name__ == "__main__":

    handlers = [(r'/', IndexHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)

    application.listen(8088)
    ioloop.IOLoop.instance().start()

