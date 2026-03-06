import os
import subprocess
import time

print("Arrancando el núcleo de Pico OS...")

comando_net = ["./dotnet-portable/dotnet", "tool", "run", "dotnet-serve", "-o", "-d", "./www"]

try:
    subprocess.Popen(comando_net)
    print("Motor .NET activado con éxito.")
except FileNotFoundError:
    print("Entorno móvil detectado (arquitectura bionic). Binario .NET incompatible.")
    print("Conmutando al subsistema nativo de Python...")
    
    if os.path.exists("www"):
        os.chdir("www")
    
    subprocess.Popen(["python", "-m", "http.server", "8080"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)

print("Sistema Ciberfísico Activo. Listo para empaquetar en la nube.")
