from flask import Flask, request, jsonify
import requests

app = Flask(__name__, static_folder='.')

@app.route('/query', methods=['GET'])
def proxy_query():
    query_params = request.args
    query = query_params.get('query')

    print(query)

    url = f"https://query.wikidata.org/sparql?origin=*&query={query}&format=json"
    req = requests.get(url)
    print('Results from wikidata')
    print(req.json())
    return req.json()
    #return query

@app.route('/<path:path>', methods=['GET'])
def static_file(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    app.run()