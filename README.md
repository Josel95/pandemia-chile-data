# pandemia-chile-data

Este proyecto recolecta los datos obtenidos desde el repositorio [MinCiencia](https://github.com/MinCiencia/Datos-COVID19), los sube a firebase y es utilizada por el proyecto [Pandemia Chile](https://github.com/Josel95/pandemia-chile).

## Como se usa

Usa el gestor de paquetes `npm` para instalar las dependencia.

```bash
npm install
```

Debes crear el archivo `firebaseCredentials.json` dentro de la carpeta `src/`. Aquí deben ir las credenciales del proyecto de firebase. El archivo deve contener la siguiente estructura.

```json
{
    "apiKey": "TU API KEY",
    "authDomain": "nombre-proyecto-firebase.firebaseapp.com",
    "projectId": "nombre-proyecto-firebase",
    "storageBucket": "nombre-proyecto-firebase.appspot.com",
    "messagingSenderId": "TU MESSAGING SENDER ID",
    "appId": "TU APP ID",
    "measurementId": "TU MEASUREMENT ID"
}
```

Ahora puedes ejecutar el proyecto.

```bash
npm start
```


## Contribuciones
Este proyecto es desarrollado en mis tiempos libres y solo por hobby. De todas maneras si deseas colaborar bienvenido sea.

## License
[MIT](https://choosealicense.com/licenses/mit/)