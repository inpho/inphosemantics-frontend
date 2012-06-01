import json
import os.path
import random
import time

from tornado import ioloop, web

def dummy_data(corpus, corpus_param, model, model_param, phrase, n):
    
    result_phrase = (corpus[0] + corpus_param[0] + model[0] 
                     + model_param[0] + '-' + phrase)
    
    result = [{result_phrase: ((1.0 / len(phrase)) - (i * .01)) } 
                 for i in xrange(n)]
    
    server_lag = random.randint(1,5)
    print 'Simulated server lag:', server_lag
    time.sleep(server_lag)
    print 'Result', result
    
    return result

# TODO: add concurrency

class DataHandler(web.RequestHandler):
    def get(self):
        # TODO: try / catch : raise new 400 exception
        #try:
        corpus = self.get_argument('corpus').split('.')[0]
        corpus_param = self.get_argument('corpus').split('.')[1]
        
        model = self.get_argument('model').split('.')[0]
        model_param = self.get_argument('model').split('.')[1]
        
        phrase = self.get_argument('phrase')

        # TODO: handle if not int : raise exception
        count = int(self.get_argument('searchLimit'))

        result = dummy_data(corpus, corpus_param, model, 
                            model_param, phrase, count)

        self.write(json.dumps(result))
        self.set_header("Content-Type", "application/json; charset=UTF-8")


class IndexHandler(web.RequestHandler):

    def get(self):
        self.render('index.html')

if __name__ == "__main__":

    handlers = [(r'/', IndexHandler),
                (r'/data', DataHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)

    application.listen(9090)
    ioloop.IOLoop.instance().start()

