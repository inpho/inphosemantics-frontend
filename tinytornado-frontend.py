#!/usr/bin/python

import os.path
from tornado import ioloop, web
import time
import random

class FrontEndHandler(web.RequestHandler):

    def get(self):
        self.render('frontend.html')

    def post(self):

        corpus = self.get_argument('corpus').split('.')[0]
        corpus_param = self.get_argument('corpus').split('.')[1]
        model = self.get_argument('model').split('.')[0]
        model_param = self.get_argument('model').split('.')[1]
        query = self.get_argument('phrase')
        n = 20

        term = (corpus[0] + corpus_param[0] + model[0] 
                + model_param[0] + '-' + query)
        
        result = {'result': [{ term: ((1.0 / len(term)) - (i * .01)) } 
                             for i in xrange(n)]}

        server_lag = random.randint(1,5)
        print 'Simulated server lag:', server_lag
        time.sleep(server_lag)
        print 'Result', result

        self.write(result)


if __name__ == "__main__":

    handlers = [(r'/', FrontEndHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)

    application.listen(8080)
    ioloop.IOLoop.instance().start()

