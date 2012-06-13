#!/usr/bin/python

import json
import os.path
import random
import time

#from mako.template import Template
from tornado import ioloop, web

def dummy_data(corpus, corpus_param, model, model_param, phrase, n):

    result_phrase = (corpus[:1] + corpus_param[:1] + model[:1] 
                     + model_param[:1] + '-' + phrase)
    
    result = [{result_phrase: ((1.0 / len(phrase)) - (i * .01)) } 
                 for i in xrange(n)]
    
    # server_lag = random.randint(1,5)
    # print 'Simulated server lag:', server_lag
    # time.sleep(server_lag)
    print 'Result', result
    
    return result

# TODO: add concurrency

class DataHandler(web.RequestHandler):
    def get(self):
        # TODO: try / catch : raise new 400 exception
        #try:
        corpus = self.get_argument('corpus').split('.')[0]
        corpus_param = self.get_argument('corpus').split('.')[1]
        
        model_arg = self.get_argument('model').split('.')
        model = model_arg[0]
        model_param = model_arg[1] if len(model_arg) == 2 else ""
        
        phrase = self.get_argument('phrase')

        # TODO: handle if not int : raise exception
        count = int(self.get_argument('searchLimit'))

        result = dummy_data(corpus, corpus_param, model, 
                            model_param, phrase, count)

        self.write(json.dumps(result))
        self.set_header("Content-Type", "application/json; charset=UTF-8")


class IndexHandler(web.RequestHandler):

    def get(self):
        #template = Template(filename='templates/index.html')
        #self.write(template.render())
        self.render('index.html')

if __name__ == "__main__":

    handlers = [(r'/', IndexHandler),
                (r'/data', DataHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)
    port = 8080
    application.listen(port)
    print "server listening on port", port
    ioloop.IOLoop.instance().start()

