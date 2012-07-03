#!/usr/bin/python

import json
import os.path
import random
from datetime import datetime

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

class IndexHandler(web.RequestHandler):

    def get(self):
        #template = Template(filename='templates/index.html')
        #self.write(template.render())
        self.render('index.html')


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


class ExportHandler(web.RequestHandler):

    def get(self):
        try:
            ## fetch the parameters
            corpus    = self.get_argument('corpus').split('.')[0]
            param     = self.get_argument('corpus').split('.')[1]
            modelArgs = self.get_argument('model').split('.')
            model     = modelArg[0] + modelArg[1]
            phrase    = self.get_argument('phrase')
            width     = int(self.get_argument('matrixWidth'))

            ## Perform backend work
            # result = inpho.get_Word2Word_csv(corpus      = corpus,
            #                                 corpusParam = param,
            #                                 model       = model,
            #                                 phrase      = phrase,
            #                                 matrixWidth = width)
            result = "[exportQueryResult]"
            
            # Return the result
            self.set_header("Content-Type", "application/json; charset=UTF-8")
            self.write(json.dumps(result))

        except:
            self.send_error( reason = "Uncaught error in ExportHandler" )

    def write_error(self, status_code, reason = None, **kwargs):
        self.finish(reason)
        



############
##  MAIN  ##
############
            


if __name__ == "__main__":

    handlers = [(r'/', IndexHandler),
                (r'/data', DataHandler),
                (r'/export', ExportHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)
    port = 9090
    application.listen(port)
    print "\n%s" % datetime.now()
    print "Inphosemantics Frontend @ http://localhost:%d\n" % port
    ioloop.IOLoop.instance().start()

