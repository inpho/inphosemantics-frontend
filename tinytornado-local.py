#!/usr/bin/python

from tornado import ioloop, web


class IndexHandler(web.RequestHandler):

    def get(self):
        self.render('index.html')



if __name__ == "__main__":

    handlers = [(r'/', IndexHandler),
                (r'/(.*)', web.StaticFileHandler, dict(path = '.'))]
        
    application = web.Application(handlers)

    application.listen(8080)
    ioloop.IOLoop.instance().start()

