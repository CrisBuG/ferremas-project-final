import requests
import json
from datetime import datetime

def get_dollar_rate():
    """
    Obtiene el valor actual del dólar en pesos chilenos (CLP) desde una API pública.
    """
    try:
        # Usando la API de mindicador.cl que proporciona indicadores económicos de Chile
        url = "https://mindicador.cl/api/dolar"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            # Obtener el valor más reciente
            latest_value = data['serie'][0]['valor']
            date = data['serie'][0]['fecha']
            
            return {
                'success': True,
                'rate': latest_value,
                'date': date,
                'source': 'mindicador.cl'
            }
        else:
            return {
                'success': False,
                'error': f"Error al obtener datos: {response.status_code}"
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def save_dollar_rate():
    """
    Obtiene y guarda el valor del dólar en un archivo JSON.
    """
    result = get_dollar_rate()
    
    if result['success']:
        # Guardar en archivo para uso en la aplicación
        with open('dollar_rate.json', 'w') as f:
            json.dump(result, f, indent=4)
        
        print(f"Valor del dólar obtenido: {result['rate']} CLP")
        print(f"Fecha: {result['date']}")
        return result
    else:
        print(f"Error: {result['error']}")
        # Crear un valor por defecto en caso de error
        default_value = {
            'success': True,
            'rate': 850.0,  # Valor aproximado del dólar en CLP (2025)
            'date': datetime.now().isoformat(),
            'source': 'default_value',
            'note': 'Este es un valor por defecto usado cuando la API no está disponible'
        }
        
        with open('dollar_rate.json', 'w') as f:
            json.dump(default_value, f, indent=4)
        
        print(f"Se ha usado un valor por defecto: {default_value['rate']} CLP")
        return default_value

if __name__ == "__main__":
    save_dollar_rate()
