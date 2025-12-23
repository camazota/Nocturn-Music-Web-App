from flask import Flask, render_template, request, jsonify, session, redirect
import mysql.connector
import bcrypt



app = Flask(__name__)
app.secret_key = 'nocturn'

def get_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='root', 
        database='db'
    )

    
@app.get('/')
def home():
    if 'userId' in session:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT userId FROM users WHERE userId = %s", (session['userId'],))
        userId = cur.fetchone()
        cur.close()
        conn.close()
        if not userId:
            session.clear()
            return redirect('/login')
        return render_template('index.html')
    
    return redirect('/login')


    

@app.get('/login')
def get_login():
    if 'userId' in session:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT userId FROM users WHERE userId = %s", (session['userId'],))
        userId = cur.fetchone()
        cur.close()
        conn.close()
        if not userId:
            return render_template('login.html')
        return redirect('/')
    return render_template('login.html')


@app.post('/api/login')
def post_login():
    userName = request.json.get('username')
    password = request.json.get('password')

    
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT userId, userName, password FROM users WHERE userName=%s", 
                   (userName,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if user:
        if bcrypt.checkpw(password.encode('utf-8'),user['password']):
            session['userId'] = user['userId']
            session['userName'] = user['userName']
            return jsonify({'success': 'Giriş Başarılı'})
        else:
            return jsonify({'error':'Şifre hatalı'})
    else:
        return jsonify({'error': 'Kullanıcı adı hatalı'})

@app.post('/api/register')
def post_register():
    username = request.json.get('username')
    password = request.json.get('password')
    firstname = request.json.get('firstname', '')
    lastname = request.json.get('lastname', '')
    
    password = password.encode('utf-8')
    hashedPassword = bcrypt.hashpw(password,bcrypt.gensalt())
    
    conn = get_db()
    cur = conn.cursor()

    if not username:
        return jsonify({'error':'Kullanıcı adı girilmedi'})

    cur.execute('SELECT userId FROM users WHERE userName = %s', (username,))
    user = cur.fetchone()
    if user:
        cur.close()
        conn.close()
        return jsonify({'error':'Bu kullanıcı adı kullanılıyor'})
    cur.execute("INSERT INTO users (userName, firstName, lastName, password) VALUES (%s,%s,%s,%s)",
                    (username, firstname, lastname, hashedPassword))
    conn.commit()
    userId = cur.lastrowid
    session['userId'] = userId
    session['userName'] = username
    cur.close()
    conn.close()
    return jsonify({'success': 'Kayıt Başarılı'})
    

@app.post('/api/logout')
def logout():
    session.clear()
    return jsonify({'success': 'Çıkış Başarılı'})

@app.get('/api/profile')
def get_profile():
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'})
    
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT userId, userName, firstName, lastName, profilePicPath
        FROM users
        WHERE userId = %s
    """, (session.get('userId'),))
    user = cur.fetchone()
    
    cur.execute("""
        SELECT p.playlistId , p.playlistName, p.playlistBanner, count(ps.songId) songCount
        FROM playlists p
        LEFT JOIN playlist_song ps
        ON ps.playlistId = p.playlistId
        WHERE p.userId = %s
        GROUP BY p.playlistId
    """, (session['userId'],))


    playlists = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify({
        'user': user,
        'playlists': playlists
    })


@app.get('/api/songs')
def get_songs():
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'})
    
    search = request.args.get('search', '')
    
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    
    if search:
        cur.execute("""SELECT s.*, si.singerName as singers
            FROM songs s
            LEFT JOIN singers si ON s.singerId = si.singerId
            WHERE s.songName LIKE %s OR si.singerName LIKE %s
            LIMIT 20""", (f'%{search}%', f'%{search}%'))
    else:
        cur.execute("""
            SELECT s.*, si.singerName as singers
            FROM songs s
            LEFT JOIN singers si ON s.singerId = si.singerId
            ORDER BY RAND()
        """)
    songs = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(songs)

@app.get('/api/categories')
def get_categories():
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM songs ORDER BY RAND()")
    categories = [satir[0] for satir in cursor.fetchall()]
    conn.close()
    return jsonify(categories)



@app.get('/api/playlists')
def get_playlists():
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'}), 401
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT DISTINCT playlistId, playlistName, playlistBanner FROM playlists WHERE userId=%s",
                   (session['userId'],))
    playlists= cursor.fetchall()
    conn.close()
    return jsonify(playlists)




@app.post('/api/playlists')
def create_playlist():
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'})
    
    playlistName = request.json.get('playlistName')
    if not playlistName:
        return jsonify({'error':'Playlist Adı yok'})

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT u.userId FROM users u INNER JOIN playlists p ON p.userId = u.userId WHERE u.userId = %s AND p.playlistName = %s", (session.get("userId"),playlistName))
    temp = cur.fetchone()
    if temp:
        return jsonify({'error':'Playlist zaten mevcut'})

    cur.execute("INSERT INTO playlists (playlistName, userId) VALUES (%s,%s)",
                   (playlistName, session['userId']))
    conn.commit()
    playlistId = cur.lastrowid
    cur.close()
    conn.close()
    return jsonify({'success': 'Playlist oluşturuldu', 'playlistId': playlistId})



@app.get('/api/playlists/<int:playlistId>/songs')
def get_playlists_songs(playlistId):
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'}), 401
    
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT s.*, si.singerName as singers
        FROM songs s
        JOIN playlist_song ps ON s.songId = ps.songId
        LEFT JOIN singers si ON s.singerId = si.singerId
        WHERE ps.playlistId = %s
        ORDER BY ps.added_at DESC
    """, (playlistId,))
    songs = cur.fetchall()
    cur.execute("SELECT playlistName FROM playlists WHERE playlistId = %s",(playlistId,))
    playlistName = cur.fetchone()
    playlistName = playlistName['playlistName']
    cur.close()
    conn.close()
    return jsonify({
        'songs': songs,
        'playlistName': playlistName
    })




@app.post('/api/playlists/<int:playlistId>/songs')
def addSongToPlaylist(playlistId):
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'})
    
    songId = request.json['songId']
    
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO playlist_song (playlistId, songId) VALUES (%s,%s)",
                       (playlistId, songId))
        conn.commit()

        cur.execute('SELECT s.*, si.singerName FROM songs s RIGHT JOIN singers si ON si.singerId = s.singerId WHERE s.songId = %s',(songId,))

        song = cur.fetchone()
        return jsonify({'success': 'Şarkı playliste eklendi', 'song':song})
    except:
        return jsonify({'error': 'Şarkı zaten playlistte var'})
    finally:
        cur.close()
        conn.close()




@app.delete('/api/playlists/<int:playlistId>/songs/<int:songId>')
def playlistten_sarki_sil(playlistId, songId):
    if 'userId' not in session:
        return jsonify({'error': 'Giriş yapmalısınız'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM playlist_song WHERE playlistId=%s AND songId=%s",
                   (playlistId, songId))
    conn.commit()
    conn.close()
    return jsonify({'success': 'Şarkı başarıyla silindi'})



@app.post('/api/playlists/<int:playlistId>')
def edit_playlist(playlistId):
    if not 'userId' in session:
        return jsonify({'error':'yetkisiz erişim'})
    
    playlistName = request.json.get('playlistName')


    userId = session.get('userId')
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT userId, playlistName FROM playlists WHERE playlistId = %s", (playlistId,))
    temp = cur.fetchone()

    cur.execute("SELECT playlistName FROM playlists where userId = %s", (session['userId'],))
    temp2 = cur.fetchall()
    if temp['userId'] != userId:
        cur.close()
        conn.close()
        return jsonify({'error': "Kullanıcı eşleşmesi hatalı!"})

    if temp['playlistName'] == playlistName:
        return jsonify({'error':'Playlist ismi değişmedi. Lütfen farklı bir isim girin.'})
    
    for t in temp2:
        if t['playlistName'] == playlistName:
            return jsonify({'error':'Playlist ismi zaten mevcut.'})
        
  
    
        
    else:
        cur.execute("UPDATE playlists SET playlistName = %s WHERE playlistId = %s", (playlistName,playlistId,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'success': 'Playlist ismi başarıyla değiştirildi'})

    

@app.get('/api/delete-playlist/<int:playlistId>')
def deletePlaylist(playlistId):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT userId from playlists where playlistId = %s", (playlistId,))
    temp = cur.fetchone()
    if session['userId'] == temp['userId']:
        cur.execute("DELETE FROM playlists where playlistId = %s", (playlistId,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'success': 'Başarıyla silindi'})
    else:
        cur.close()
        conn.close()
        return jsonify({'error': "Playlist silinemedi"})



@app.post("/api/delete-account/")
def delete_account():
    userId = request.json.get('userId')
    if not userId:
        return jsonify({'error': 'Kullanıcı adı eksik!'})
    
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT userId FROM users WHERE userId = %s", (userId,))
    temp = cur.fetchone()
    
    if not temp:
        cur.close()
        conn.close()
        return jsonify({'error': 'Kullanıcı bulunamadı'})

    if session.get('userId') != temp['userId']:
        cur.close()
        conn.close()
        return jsonify({'error': 'Yetkisiz Erişim!'})

    cur.execute("DELETE FROM users WHERE userId = %s", (userId,))
    conn.commit()
    cur.close()
    conn.close()
    session.clear()
    return jsonify({'success':'Hesap silme işlemi başarılı'})


@app.post('/api/redituser/')
def redituser():
    if 'userId' not in session:
        return jsonify({'error':'Yetkisiz Erişim!'})
    
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT userId FROM users WHERE userId = %s", (session.get('userId'),))
    temp = cur.fetchone()
    if not temp:
        return jsonify({'error':'Hatalı kullanıcı id'}) 


    
    userName = request.json.get('userName')

    if userName:
        cur.execute('SELECT userId FROM users WHERE userName = %s', (userName,))
        temp = cur.fetchone()
        if temp:
            return jsonify({'error' : 'Kullanıcı adı kullanılıyor.'})

    allowed_fields = ["userName", "firstName", "lastName", "password"]

    set_parts = []
    values = []


    if "password" in request.json and request.json["password"]:
        request.json["password"] = bcrypt.hashpw(request.json['password'], bcrypt.gensalt())
    for field in allowed_fields:
        if field in request.json and request.json.get(field) != '':
            set_parts.append(f"{field} = %s")
            values.append(request.json[field])

    query = f"""
        UPDATE users
        SET {', '.join(set_parts)}
        WHERE userId = %s
    """

    if not values:
        return jsonify({'error': 'Güncellenecek veri yok'})
    values.append(session.get('userId'))
    
    cur.execute(query,values)
    conn.commit()
    return jsonify({'success':'Profil bilgileri güncellendi'})



app.run(port=8080)