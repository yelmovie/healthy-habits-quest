# 127.0.0.1 전용 수신기: 브라우저(REPL)가 받은 Flow 영상을 외장 SSD clips/ 에 저장한다. 허용 이름 6개만.
import http.server, os, sys
from urllib.parse import urlparse, parse_qs
DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clips')
OK = {'I-1', 'I-2', 'I-3', 'F-1', 'F-2', 'F-3'}
class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS'); self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        n = parse_qs(urlparse(self.path).query).get('name', [''])[0]
        if n not in OK: self.send_response(400); self._cors(); self.end_headers(); return
        size = int(self.headers.get('Content-Length', '0')); data = self.rfile.read(size)
        with open(os.path.join(DIR, n + '.mp4'), 'wb') as f: f.write(data)
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(str(len(data)).encode())
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', 4498), H).serve_forever()
