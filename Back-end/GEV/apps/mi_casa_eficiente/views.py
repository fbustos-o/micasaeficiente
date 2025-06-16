from django.shortcuts import render

# Create your views here.
def IndexView(request):
    '''
    Función que retorna un mensaje de bienvenida.    
    '''
    return render(request, "index.html")