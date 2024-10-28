import requests as rq
import json 
import simplejson 
#Función de Geoserver para determinar la comuna de un punto geográfico
def getGeoData(lat,lon):
        llamada = { 
                "SERVICE": "WMS",
                "VERSION": "1.1.0",
                "REQUEST": "GetFeatureInfo",
                "FORMAT": "image/png",
                "TRANSPARENT": "true",
                "QUERY_LAYERS": "aerotermia:Chile_Comunas", #"api:Chile_Comunas_INE_2017_v2",
                "STYLES": "", 
                "LAYERS": "aerotermia:Chile_Comunas",
                "INFO_FORMAT": "application/json",
                "FEATURE_COUNT": 50, 
                "X": 50, 
                "Y": 50, 
                "SRS": "EPSG:4326",
                "WIDTH": 101,
                "HEIGHT": 101,
                "BBOX": str(lon-0.1)+","+str(lat-0.1)+","+str(lon+0.1)+","+str(lat+0.1)
        }   
        GEOSERVER_URL = "https://geoserver.exploradorenergia.cl/geoserver/aerotermia/wms"
        headers = {"Content-Type": "application/json"}
        try:
                r = rq.get(GEOSERVER_URL, params = llamada, headers=headers)
        except Exception as inst:
                raise Exception('No route to api host: ' + GEOSERVER_URL + '. ' + str(inst))
        if not r.status_code == 200:
                raise Exception('SIN CONEXION AL API')
        try:
                api_response = json.loads(r.content)
                data = api_response["features"][0]["properties"]
        except:
                raise Exception('Api no ha respondido con un JSON valido')
        try:
                server_error = api_response['_ERROR']
        except:
                #return api_response
                return data
        raise Exception('Error en respuesta del API: '+str(server_error)+'. Configuracion: '+llamadaJson)

#Función de conexión a la API ER

################################################################################################
## 1: funcion de consulta consulta de punto (función de consulta, contiene lat, lon y periodo)##
################################################################################################
def api_request(llamada):
    # Funcion que realiza la llamada al api y maneja algunas excepciones que es posible que ocurran
    # ENTRADA:
    key_api = '658c3205ad3eec2e17807c647c647126774dee02'
    #key_api = 'de039586ddc7d29b49517c1dbf79853862c9dea6'
    #key_api = 'INSERTAR API KEY SOLICITADA'
    API_URL = 'https://api.minenergia.cl/api/proxy'
    # llamada: Dict con la configuracion de la llamada siguiendo el formato del API
    # SALIDA:
    # api_response: Dict con la respuesta del API. El contenido depende de la llamada que haya
    # 	sido realizada, por lo que el chequeo de esta info se debe realizar en el caller de esta funcion.
    # EXCEPCIONES MANEJADAS:
    # - No route to api host: Cuando no es posible realizar el request. 
    # - Sin conexion al API: engloba varios posibles errores en el lado del API. 
    # - Api no ha respondido con un JSON valido: A veces el API devuelve un string vacio. 
    # - Error en respuesta del API: Para cuando el API devuelve "server error"
    
    llamadaJson = simplejson.dumps(llamada).encode('utf8')
    headers = {'Content-type': 'application/json', 'Accept': '*/*', "Authorization": "Token "+key_api}
    try:
        r = rq.post(API_URL, data = llamadaJson, headers=headers)
        print('Consulta OK, status:'+str(r.status_code))
        
    except Exception as inst:
        raise Exception('No route to api host: ' + API_URL + '. ' + str(inst))

    if not r.status_code == 200:
        raise Exception('SIN CONEXION AL API')
    try:
        api_response = json.loads(r.text)
    except:
        raise Exception('Api no ha respondido con un JSON valido')
    try:
        server_error = api_response['_ERROR']
        # print api_response
    except:
        return api_response
    raise Exception('Error en respuesta del API: '+str(server_error)+'. Configuracion: '+str(llamadaJson))

################################################################################################
##### 2: LLAMADO DE DICCIONARIO PARA OBTENER API RESPONSE   (NO MOFIFICAR)   ###################
################################################################################################

def llamado(lat, lon): 
    llamado_dict = {}
    llamado_dict = {
      "action": {
      "action": "series",
      "interval": "hour",
      "stat": "mean",
      "tmy": True
    },
    "period": {
      "start": "2007-01-01",
      "end": "2016-12-31"
    },
    "export": {
      "label": "datos",
      "format": "json"
    },
    "variables": [
      {
        "id": "tempc",
        "options": {
          "label": "Temp",
          "stat": "default",
          "recon": "on"
        }
      },
      {
        "id": "rh",
        "options": {
          "label": "Hum",
          "stat": "default",
          "recon": "on"
        }
      },
      {
        "id": "ghi",
        "options": {
          "label": "GHI",
          "stat": "default",
          "band": "full",
          "clearsky": False,
          "fill_missing": True
        }
      },
      {
        "id": "dir",
        "options": {
          "label": "DIR",
          "stat": "default",
          "band": "full",
          "clearsky": False,
          "fill_missing": True,
          "receptor": {
            "type": "tilt",
            "azimuth": 0,
            "elev1": 99,
            "elev2": 0,
            "hsatmax": 45,
            "optimize": False,
            "optimize_on_rglb": False
          }
        }
      },
      {
        "id": "dif",
        "options": {
          "label": "DIF",
          "stat": "default",
          "band": "full",
          "clearsky": False,
          "fill_missing": True,
          "receptor": {
            "type": "tilt",
            "azimuth": 0,
            "elev1": 99,
            "elev2": 0,
            "hsatmax": 45,
            "optimize": False,
            "optimize_on_rglb": False
          }
        }
      }
    ],
    "position": [
      {
        "label": "S1",
        "type": "point",
        "lon": lon,
        "lat": lat
      }
        ]
    }
    formato =llamado_dict['export']['format']
    #revisión de diccionario para ciertas restrictiones: 
    if len(llamado_dict["position"]) > 10: 
        print('Demasiados puntos en la consulta, reducir y volver a consultar')
    else:
        api_response = api_request(llamado_dict)
        print(f'Respuesta de datos OK, datos disponibles para uso en formato {formato}')
    return api_response, formato 