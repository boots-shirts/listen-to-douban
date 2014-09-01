#!/usr/bin/env python
import os
import time
import random
import json
import urllib
import urllib2
import re
from bs4 import BeautifulSoup
from flask import Flask, Response, redirect, url_for, session, request,jsonify, render_template
from flask_oauthlib.client import OAuth
from flask.ext.socketio import SocketIO, emit


                     
app = Flask(__name__)
#app.debug = True
app.secret_key = os.urandom(24)
socketio = SocketIO(app)


oauth = OAuth(app)
douban = oauth.remote_app(
    'douban',
    consumer_key='04c4a514ce9d1a180e4def3e6bd74e48',
    consumer_secret= '5917659cdb955f0a',
    base_url='https://api.douban.com/',
    request_token_url=None,
    request_token_params={'scope': 'douban_basic_common,shuo_basic_r,shuo_basic_w,community_basic_user'},
    access_token_url='https://www.douban.com/service/auth2/token',
    authorize_url='https://www.douban.com/service/auth2/auth',
    access_token_method='POST',
)


@app.route('/')                                                   
def index():
    if 'douban_token' in session:
        return redirect(url_for('home'))  
    return redirect(url_for('login'))

@app.route('/login')
def login():
    return douban.authorize(callback=url_for('authorized', _external=True))



@app.route('/login/authorized')
@douban.authorized_handler
def authorized(resp):
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )
    elif 'access_token' in resp:
        session['douban_token'] = (resp['access_token'],'')
        session['refresh_token']= resp['refresh_token']
        return redirect(url_for('index'))
    else:                                                    
        return jsonify(resp)                                 
    return redirect(url_for('error'))

@douban.tokengetter
def get_douban_oauth_token():
    return session.get('douban_token')




@app.route('/home')                                            
def home():
    return render_template('home2.html')
                     


@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/logout')
def logout():
    session.pop('douban_token', None)
    return redirect(url_for('index'))

@app.route('/error')
def error():
    return 'something wrong with access_token!'


times=0
@socketio.on('send data', namespace='/_GET')              
def sendData():
    global times
    count=ct()
    resp=douban.request('shuo/v2/statuses/home_timeline?count='+str(count))
    times=times+1
    d=resp.data
    #d=get_num(data)
    while len(d)>=3:
        n=random.randint(1,3)
        for i in range(n):
            e=d.pop()
            get_num(e)
            emit('message',{'data':json.dumps(e)})
            time.sleep(1)
        time.sleep(2)
    while len(d)!=0:
        e=d.pop()
        get_num(e)
        emit ('message',{'data':json.dumps(e)})
        time.sleep(3)
    if times>1:
        time.sleep(300)    #to avoid repetition
    emit('next')

def ct():
    global times
    if times==0:
        count=200
    elif times==1:
        count=30
    else:
        count=10
    return count



def get_num(i):                                                             
    u=i['user']['id']
    webpage=urllib.urlopen("http://www.douban.com/people/"+u+"/")
    soup=BeautifulSoup(webpage.read().decode('utf-8','ignore'))
    info=soup.find("p",class_="rev-link")
    try:
        text=info.get_text().encode('utf-8', 'ignore')
        nums=re.findall(r'\d+',text)
        n=nums[0]
        i['size']=n
    except AttributeError:
        i['size']=0
        pass
    return i

    

#@socketio.on('connect', namespace='/_GET')
#def test_connect():
#    emit('my response', {'data': 'Connected', 'count':0})
    
    

@socketio.on('disconnect', namespace='/_GET')
def test_disconnect():
    print('Client disconnected') 


    

#if __name__ == '__main__':
#    socketio.run(app)
    


