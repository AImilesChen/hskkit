import http.server, socketserver, os
os.chdir('.next')
handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(('127.0.0.1', 8788), handler)
print('Server started on 127.0.0.1:8788')
httpd.serve_forever()
