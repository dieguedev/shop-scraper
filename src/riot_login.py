#!/usr/bin/env python3
"""
Riot Client Login Automation
Automatiza el login en el Riot Client usando detección de imágenes con PyAutoGUI.
"""

import sys
import time
import os
from pathlib import Path

try:
    import pyautogui
    import pygetwindow as gw
except ImportError as e:
    print(f"Error! Falta instalar las dependencias de Python. Ejecuta -> npm run install:python", file=sys.stderr)
    print(f"Detalle: {e}", file=sys.stderr)
    sys.exit(1)


# Configuración
LOGIN_WAIT_SECONDS = 5
POST_LOGIN_WAIT_SECONDS = 3
IMAGE_SEARCH_TIMEOUT = 10
CONFIDENCE = 0.7
CLICK_DELAY = 0.5
TYPE_INTERVAL = 0.05

# Códigos de salida
EXIT_SUCCESS = 0
EXIT_ERROR = 1
EXIT_IMAGE_NOT_FOUND = 2
EXIT_TIMEOUT = 3


def log(message):
    """Imprime un mensaje con timestamp"""
    try:
        print(f"[riot_login] {message}", flush=True)
    except UnicodeEncodeError:
        # Fallback para consolas que no soportan Unicode
        print(f"[riot_login] {message.encode('ascii', 'replace').decode('ascii')}", flush=True)


def find_riot_window(timeout=60):
    """
    Busca y activa la ventana del Riot Client.
    
    Args:
        timeout: Tiempo máximo de espera en segundos
        
    Returns:
        Objeto ventana de pygetwindow
        
    Raises:
        TimeoutError: Si no encuentra la ventana en el tiempo especificado
    """
    log("Buscando ventana del Riot Client...")
    elapsed = 0
    
    while elapsed < timeout:
        windows = gw.getWindowsWithTitle('Riot Client')
        if windows:
            window = windows[0]
            log(f"Ventana encontrada: {window.title}")
            
            # Activar ventana
            try:
                window.activate()
                time.sleep(0.5)
                log("Ventana activada")
                return window
            except Exception as e:
                log(f"Advertencia al activar ventana: {e}")
                return window
        
        time.sleep(2)
        elapsed += 2
    
    raise TimeoutError("No se encontró la ventana del Riot Client")


def wait_for_image(image_path, timeout=IMAGE_SEARCH_TIMEOUT, confidence=CONFIDENCE):
    """
    Espera hasta que una imagen aparezca en pantalla.
    
    Args:
        image_path: Ruta a la imagen de referencia
        timeout: Tiempo máximo de espera en segundos
        confidence: Nivel de confianza para la detección (0.0-1.0)
        
    Returns:
        Box con la ubicación de la imagen (left, top, width, height)
        
    Raises:
        FileNotFoundError: Si la imagen de referencia no existe
        TimeoutError: Si no encuentra la imagen en el tiempo especificado
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Imagen de referencia no encontrada: {image_path}")
    
    image_name = os.path.basename(image_path)
    log(f"Buscando imagen: {image_name} (confidence={confidence})...")
    
    elapsed = 0
    interval = 0.5
    
    while elapsed < timeout:
        try:
            location = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if location:
                log(f"[OK] Imagen encontrada: {image_name} en {location}")
                return location
        except pyautogui.ImageNotFoundException:
            pass
        except Exception as e:
            log(f"Advertencia durante búsqueda de imagen: {e}")
        
        time.sleep(interval)
        elapsed += interval
    
    # Si no encuentra la imagen, guarda un screenshot para debug
    try:
        debug_screenshot = f"debug_screenshot_{image_name}"
        pyautogui.screenshot(debug_screenshot)
        log(f"Screenshot guardado para debug: {debug_screenshot}")
    except Exception as e:
        log(f"No se pudo guardar screenshot de debug: {e}")
    
    raise TimeoutError(f"No se encontró la imagen {image_name} después de {timeout}s")


def click_image(image_path, timeout=IMAGE_SEARCH_TIMEOUT, confidence=CONFIDENCE):
    """
    Busca una imagen en pantalla y hace click en su centro.
    
    Args:
        image_path: Ruta a la imagen de referencia
        timeout: Tiempo máximo de espera en segundos
        confidence: Nivel de confianza para la detección (0.0-1.0)
    """
    location = wait_for_image(image_path, timeout, confidence)
    center = pyautogui.center(location)
    
    log(f"Haciendo click en {center}")
    pyautogui.click(center)
    time.sleep(CLICK_DELAY)


def type_text(text, interval=TYPE_INTERVAL):
    """
    Escribe texto con un intervalo entre caracteres.
    
    Args:
        text: Texto a escribir
        interval: Tiempo entre caracteres en segundos
    """
    log(f"Escribiendo texto (longitud: {len(text)})")
    
    # pyautogui.write() solo funciona con ASCII
    # Para mayor compatibilidad, usamos typewrite con cada carácter
    for char in text:
        pyautogui.typewrite(char, interval=interval)
    
    time.sleep(CLICK_DELAY)


def main():
    """Función principal de automatización"""
    if len(sys.argv) < 3:
        print("Uso: python riot_login.py <username> <password>", file=sys.stderr)
        sys.exit(EXIT_ERROR)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    # Determinar rutas de imágenes
    script_dir = Path(__file__).parent.parent
    assets_dir = script_dir / "assets"
    
    username_field_img = assets_dir / "username_field.png"
    password_field_img = assets_dir / "password_field.png"
    login_button_img = assets_dir / "login_button.png"
    
    try:
        # Paso 1: Buscar y activar ventana del Riot Client
        find_riot_window()
        
        # Paso 2: Esperar a que cargue la pantalla de login
        log(f"Esperando {LOGIN_WAIT_SECONDS}s para que cargue la pantalla de login...")
        time.sleep(LOGIN_WAIT_SECONDS)
        
        # Paso 3: Buscar y llenar campo de username
        log("Buscando campo de usuario...")
        click_image(str(username_field_img))
        
        log("Ingresando nombre de usuario...")
        type_text(username)
        
        # Paso 4: Buscar y llenar campo de password
        log("Buscando campo de contraseña...")
        click_image(str(password_field_img))
        
        log("Ingresando contraseña...")
        type_text(password)
        
        # Paso 5: Click en botón de login (o presionar Enter si no existe)
        log("Buscando botón de login...")
        try:
            click_image(str(login_button_img), timeout=3)
        except (FileNotFoundError, TimeoutError):
            log("Botón de login no encontrado, presionando Enter...")
            pyautogui.press('enter')
            time.sleep(CLICK_DELAY)
        
        # Paso 6: Login completado
        log(f"Login enviado, esperando {POST_LOGIN_WAIT_SECONDS}s...")
        time.sleep(POST_LOGIN_WAIT_SECONDS)
        
        log("[OK] Login completado exitosamente")
        sys.exit(EXIT_SUCCESS)
        
    except FileNotFoundError as e:
        log(f"[ERROR] {e}")
        log(f"Asegúrate de que las imágenes de referencia estén en: {assets_dir}")
        sys.exit(EXIT_IMAGE_NOT_FOUND)
        
    except TimeoutError as e:
        log(f"[TIMEOUT] {e}")
        log("Sugerencias:")
        log("  - Verifica que el Riot Client esté visible en pantalla")
        log("  - Ajusta el valor de CONFIDENCE en el script (0.7-0.9)")
        log("  - Recaptura las imágenes de referencia en la misma resolución")
        sys.exit(EXIT_TIMEOUT)
        
    except KeyboardInterrupt:
        log("[CANCELLED] Proceso interrumpido por el usuario")
        sys.exit(EXIT_ERROR)
        
    except Exception as e:
        log(f"[ERROR] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(EXIT_ERROR)


if __name__ == "__main__":
    # Configuración de PyAutoGUI
    pyautogui.FAILSAFE = True  # Mover mouse a esquina superior izquierda para abortar
    pyautogui.PAUSE = 0.1  # Pausa mínima entre acciones
    
    main()
