import serial
import time
import json
import http.client
#from flask import Flask, request, jsonify

#app = Flask(__name__)

# Configuration du port série
port = '/dev/ttyUSB0'
baudrate = 9600

# Configuration du serveur Node.js
server_host = "192.168.1.25"  # Remplacez par l'adresse IP locale de votre serveur
server_port = 3002
server_endpoint = "/api/data"

try:
    ser = serial.Serial(port, baudrate, timeout=1)
    print(f"Connexion réussie sur le port {port}")
except serial.SerialException as e:
    print(f"Erreur de connexion série : {e}")
    exit(1)

def read_sensor_data():
    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                print(f"Données brutes reçues : {line}")

                if line.startswith('{'):
                    try:
                        data = json.loads(line)
                        humidity = data.get("hum")
                        brightness = data.get("lum")

                        print("Humidité (%) :", humidity)
                        print("Luminosité (%) :", brightness)

                        send_data_to_server(data)

                    except json.JSONDecodeError:
                        print("Erreur de décodage JSON.")
                else:
                    print("Message non-JSON reçu :", line)

        except UnicodeDecodeError:
            print("Erreur de décodage des données série.")
        time.sleep(1)

def send_data_to_server(data):
    try:
        json_data = json.dumps(data).encode('utf-8')
        headers = {'Content-type': 'application/json'}

        conn = http.client.HTTPConnection(server_host, server_port, timeout=10)
        conn.request("POST", server_endpoint, body=json_data, headers=headers)

        response = conn.getresponse()
        print(f"Statut de la réponse : {response.status}")
        print(f"Raison de la réponse : {response.reason}")

        response_body = response.read().decode('utf-8')
        print(f"Corps de la réponse : {response_body}")

        conn.close()

    except ConnectionRefusedError:
        print("Erreur : Connexion refusée. Vérifiez que le serveur est en cours d'exécution.")
    except Exception as e:
        print(f"Erreur de connexion au serveur : {e}")

def send_command_to_arduino(command):
    try:
        if command == 'ON':
            ser.write(b'1')  # Envoyer 1 pour activer la pompe
            print("Commande ON envoyée à l'Arduino")
        elif command == 'OFF':
            ser.write(b'0')  # Envoyer 0 pour désactiver la pompe
            print("Commande OFF envoyée à l'Arduino")
    except Exception as e:
        print(f"Erreur lors de l'envoi de la commande à l'Arduino : {e}")



#@app.route('/control-pump', methods=['POST'])
def control_pump():
    #data = request.json
   # command = data.get('command')

    #if command == 'ON':
        send_command_to_arduino('ON')
        #return jsonify(message="Pompe activée"), 200
    #elif command == 'OFF':
        send_command_to_arduino('OFF')
        #return jsonify(message="Pompe désactivée"), 200
    #else:
        #return jsonify(error="Commande invalide"), 400

if __name__ == "__main__":
    try:
        # Démarrer le thread de lecture des données des capteurs
        import threading
        sensor_thread = threading.Thread(target=read_sensor_data)
        sensor_thread.start()

        # Démarrer le serveur Flask
        #app.run(host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("Arrêt du programme.")
    finally:
        ser.close()
        print("Port série fermé.")
