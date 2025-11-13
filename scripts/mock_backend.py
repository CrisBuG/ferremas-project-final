import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class MockHandler(BaseHTTPRequestHandler):
    def _set_headers(self, code=200, content_type="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/api/auth/csrf/"):
            self._set_headers(200)
            payload = {"csrftoken": "dummy"}
            self.wfile.write(json.dumps(payload).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"detail": "Not Found"}).encode("utf-8"))

    def do_POST(self):
        if self.path.startswith("/api/auth/register/"):
            # Simular registro exitoso
            self._set_headers(200)
            payload = {"status": "ok"}
            self.wfile.write(json.dumps(payload).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"detail": "Not Found"}).encode("utf-8"))


def run(server_class=HTTPServer, handler_class=MockHandler, port=8081):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print(f"Mock backend running on http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()


if __name__ == "__main__":
    run()

