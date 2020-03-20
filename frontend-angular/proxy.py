from flask import Flask, request, jsonify
import requests

app = Flask(__name__, static_folder='.')

@app.route('/query', methods=['GET'])
def proxy_query():
    query_params = request.args
    query = query_params.get('query')

    print(query)

    url = f"https://query.wikidata.org/sparql?origin=*&query={requests.utils.quote(query)}&format=json"
    print(url)
    headers = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    req = requests.get(url, headers=headers)
    print('Results from wikidata')
    print(req)
    print(req.json())
    return req.json()
    #return query

@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('index.html')
    
@app.route('/<path:path>', methods=['GET'])
def static_file(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    app.run()