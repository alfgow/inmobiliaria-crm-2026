# API de Contactos

Documentacion de los endpoints agregados para administrar contactos, intereses y comentarios.

## Base URL

```text
/api/v1/contactos
```


## Autenticacion

Todos los endpoints requieren API key. Se puede enviar de cualquiera de estas dos formas:

```http
Authorization: Bearer crm_xxx_xxx
```

o:

```http
X-API-Key: crm_xxx_xxx
```


## Headers

Para requests con body JSON:

```http
Content-Type: application/json
```

## Formatos comunes

### Contacto

```json
{
  "id": "123",
  "nombre": "Maria Lopez",
  "email": "maria@example.com",
  "telefono": "5512345678",
  "fuente": "Web",
  "fechas": {
    "creado": "2026-07-01T20:15:00.000Z",
    "actualizado": "2026-07-01T20:20:00.000Z"
  },
  "links": {
    "self": "/api/v1/contactos/123",
    "intereses": "/api/v1/contactos/123/intereses",
    "comentarios": "/api/v1/contactos/123/comentarios"
  }
}
```

En el detalle de un contacto tambien se incluyen `intereses` y `comentarios`.

### Interes

```json
{
  "id": "10",
  "inmuebleId": "45",
  "fechaCreacion": "2026-07-01T20:15:00.000Z",
  "inmueble": {
    "id": "45",
    "slug": "casa-en-venta-centro",
    "titulo": "Casa en venta Centro",
    "direccion": "Calle 1 #100",
    "precio": {
      "monto": "2500000.00",
      "moneda": "MXN"
    },
    "visible": true,
    "estatus": {
      "nombre": "Disponible",
      "color": "#22c55e"
    }
  }
}
```

Si el inmueble asociado ya no existe, `inmueble` regresa `null`.

### Comentario

```json
{
  "id": "30",
  "comentario": "Cliente busca casa con jardin.",
  "fechaCreacion": "2026-07-01T20:15:00.000Z"
}
```

## Validaciones

- `id`, `inmuebleId`, `interesId` y `comentarioId` deben ser IDs positivos.
- `nombre` es requerido y maximo 100 caracteres.
- `telefono` es requerido, maximo 20 caracteres y debe ser unico.
- `email` es opcional, maximo 150 caracteres y debe tener formato valido si se envia.
- `fuente` es opcional, maximo 50 caracteres. En creacion, si no se envia, se guarda como `Web`.
- `comentario` es requerido para crear/editar comentarios y maximo 2000 caracteres.
- No se permite agregar dos veces el mismo inmueble como interes del mismo contacto.

## Codigos de error comunes

```json
{
  "error": "Mensaje de error."
}
```

- `400`: JSON invalido, parametros invalidos o campos requeridos faltantes.
- `401`: API key requerida o invalida.
- `403`: IP no autorizada para la API key.
- `404`: contacto, inmueble, interes o comentario no encontrado.
- `409`: conflicto por telefono duplicado o interes duplicado.
- `503`: base de datos no disponible.
- `500`: error interno no controlado.

---

## Listar contactos

```http
GET /api/v1/contactos
```

### Query params

| Parametro | Tipo | Default | Descripcion |
| --- | --- | --- | --- |
| `page` | number | `1` | Pagina a consultar. Debe ser entero positivo. |
| `perPage` | number | `20` | Registros por pagina. Maximo `100`. |
| `q` | string | `""` | Busca por `nombre`, `email` o `telefono`. Solo aplica desde 2 caracteres. |
| `fuente` | string | `""` | Filtra por fuente con comparacion case-insensitive. |

### Ejemplo

```bash
curl -X GET "http://localhost:3000/api/v1/contactos?q=maria&page=1&perPage=20" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

### Respuesta 200

```json
{
  "data": [
    {
      "id": "123",
      "nombre": "Maria Lopez",
      "email": "maria@example.com",
      "telefono": "5512345678",
      "fuente": "Web",
      "fechas": {
        "creado": "2026-07-01T20:15:00.000Z",
        "actualizado": null
      },
      "links": {
        "self": "/api/v1/contactos/123",
        "intereses": "/api/v1/contactos/123/intereses",
        "comentarios": "/api/v1/contactos/123/comentarios"
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## Crear contacto

```http
POST /api/v1/contactos
```

Crea un contacto. Opcionalmente puede crear intereses y comentarios iniciales en la misma transaccion.

### Body

```json
{
  "nombre": "Maria Lopez",
  "telefono": "5512345678",
  "email": "maria@example.com",
  "fuente": "Web",
  "intereses": ["45", "46"],
  "comentarios": ["Busca casa al norte de la ciudad."]
}
```

Tambien se aceptan estas variantes para intereses:

```json
{
  "nombre": "Maria Lopez",
  "telefono": "5512345678",
  "inmuebleId": "45"
}
```

```json
{
  "nombre": "Maria Lopez",
  "telefono": "5512345678",
  "intereses": [
    { "inmuebleId": "45" },
    { "inmueble_id": "46" }
  ]
}
```

Y estas variantes para comentarios:

```json
{
  "nombre": "Maria Lopez",
  "telefono": "5512345678",
  "comentario": "Comentario inicial."
}
```

```json
{
  "nombre": "Maria Lopez",
  "telefono": "5512345678",
  "comentarios": [
    "Primer comentario.",
    { "comentario": "Segundo comentario." }
  ]
}
```

### Ejemplo

```bash
curl -X POST "http://localhost:3000/api/v1/contactos" \
  -H "Authorization: Bearer crm_xxx_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Maria Lopez",
    "telefono": "5512345678",
    "email": "maria@example.com",
    "fuente": "Instagram",
    "intereses": ["45"],
    "comentarios": ["Busca propiedad para agosto."]
  }'
```

### Respuesta 201

Regresa el contacto creado con `intereses` y `comentarios`.

```json
{
  "data": {
    "id": "123",
    "nombre": "Maria Lopez",
    "email": "maria@example.com",
    "telefono": "5512345678",
    "fuente": "Instagram",
    "fechas": {
      "creado": "2026-07-01T20:15:00.000Z",
      "actualizado": null
    },
    "intereses": [],
    "comentarios": [
      {
        "id": "30",
        "comentario": "Busca propiedad para agosto.",
        "fechaCreacion": "2026-07-01T20:15:00.000Z"
      }
    ],
    "links": {
      "self": "/api/v1/contactos/123",
      "intereses": "/api/v1/contactos/123/intereses",
      "comentarios": "/api/v1/contactos/123/comentarios"
    }
  }
}
```

### Errores especificos

Contacto con telefono duplicado:

```json
{
  "error": "Ya existe un contacto registrado con ese telefono."
}
```

Inmuebles inexistentes:

```json
{
  "error": "Uno o mas inmuebles no existen.",
  "details": {
    "inmuebleIds": ["999"]
  }
}
```

---

## Obtener contacto

```http
GET /api/v1/contactos/{id}
```

Regresa el contacto con intereses y comentarios.

### Ejemplo

```bash
curl -X GET "http://localhost:3000/api/v1/contactos/123" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

### Respuesta 200

```json
{
  "data": {
    "id": "123",
    "nombre": "Maria Lopez",
    "email": "maria@example.com",
    "telefono": "5512345678",
    "fuente": "Web",
    "fechas": {
      "creado": "2026-07-01T20:15:00.000Z",
      "actualizado": "2026-07-01T20:20:00.000Z"
    },
    "intereses": [],
    "comentarios": [],
    "links": {
      "self": "/api/v1/contactos/123",
      "intereses": "/api/v1/contactos/123/intereses",
      "comentarios": "/api/v1/contactos/123/comentarios"
    }
  }
}
```

---

## Reemplazar contacto

```http
PUT /api/v1/contactos/{id}
```

Requiere enviar todos los campos editables del contacto.

### Body

```json
{
  "nombre": "Maria Lopez",
  "telefono": "5512345678",
  "email": "maria@example.com",
  "fuente": "Referido"
}
```

### Respuesta 200

Regresa el contacto actualizado con intereses y comentarios.

---

## Actualizar contacto parcialmente

```http
PATCH /api/v1/contactos/{id}
```

Permite actualizar uno o mas campos: `nombre`, `telefono`, `email`, `fuente`.

### Body

```json
{
  "fuente": "Facebook"
}
```

Para quitar email o fuente:

```json
{
  "email": null,
  "fuente": null
}
```

### Ejemplo

```bash
curl -X PATCH "http://localhost:3000/api/v1/contactos/123" \
  -H "Authorization: Bearer crm_xxx_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "fuente": "Facebook" }'
```

### Respuesta 200

Regresa el contacto actualizado con intereses y comentarios.

---

## Eliminar contacto

```http
DELETE /api/v1/contactos/{id}
```

Elimina el contacto y tambien sus registros asociados en:

- `intereses`
- `comentarios`
- `interacciones_ia`

### Ejemplo

```bash
curl -X DELETE "http://localhost:3000/api/v1/contactos/123" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

### Respuesta 200

```json
{
  "data": {
    "id": "123"
  },
  "message": "Contacto eliminado."
}
```

---

## Listar intereses de un contacto

```http
GET /api/v1/contactos/{id}/intereses
```

### Ejemplo

```bash
curl -X GET "http://localhost:3000/api/v1/contactos/123/intereses" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

### Respuesta 200

```json
{
  "data": [
    {
      "id": "10",
      "inmuebleId": "45",
      "fechaCreacion": "2026-07-01T20:15:00.000Z",
      "inmueble": {
        "id": "45",
        "slug": "casa-en-venta-centro",
        "titulo": "Casa en venta Centro",
        "direccion": "Calle 1 #100",
        "precio": {
          "monto": "2500000.00",
          "moneda": "MXN"
        },
        "visible": true,
        "estatus": {
          "nombre": "Disponible",
          "color": "#22c55e"
        }
      }
    }
  ]
}
```

---

## Agregar interes

```http
POST /api/v1/contactos/{id}/intereses
```

### Body

```json
{
  "inmuebleId": "45"
}
```

Tambien acepta:

```json
{
  "inmueble_id": "45"
}
```

### Ejemplo

```bash
curl -X POST "http://localhost:3000/api/v1/contactos/123/intereses" \
  -H "Authorization: Bearer crm_xxx_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "inmuebleId": "45" }'
```

### Respuesta 201

```json
{
  "data": {
    "id": "10",
    "inmuebleId": "45",
    "fechaCreacion": "2026-07-01T20:15:00.000Z",
    "inmueble": {
      "id": "45",
      "slug": "casa-en-venta-centro",
      "titulo": "Casa en venta Centro",
      "direccion": "Calle 1 #100",
      "precio": {
        "monto": "2500000.00",
        "moneda": "MXN"
      },
      "visible": true,
      "estatus": {
        "nombre": "Disponible",
        "color": "#22c55e"
      }
    }
  }
}
```

---

## Obtener interes

```http
GET /api/v1/contactos/{id}/intereses/{interesId}
```

Regresa un interes siempre que pertenezca al contacto indicado.

### Ejemplo

```bash
curl -X GET "http://localhost:3000/api/v1/contactos/123/intereses/10" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

---

## Modificar interes

```http
PATCH /api/v1/contactos/{id}/intereses/{interesId}
```

Cambia el inmueble asociado a ese interes. No modifica el inmueble, solo la relacion de interes.

### Body

```json
{
  "inmuebleId": "46"
}
```

### Ejemplo

```bash
curl -X PATCH "http://localhost:3000/api/v1/contactos/123/intereses/10" \
  -H "Authorization: Bearer crm_xxx_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "inmuebleId": "46" }'
```

### Respuesta 200

Regresa el interes actualizado.

---

## Quitar interes

```http
DELETE /api/v1/contactos/{id}/intereses/{interesId}
```

Elimina solo la relacion de interes. No elimina el contacto ni el inmueble.

### Ejemplo

```bash
curl -X DELETE "http://localhost:3000/api/v1/contactos/123/intereses/10" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

### Respuesta 200

```json
{
  "data": {
    "id": "10"
  },
  "message": "Interes eliminado."
}
```

---

## Listar comentarios de un contacto

```http
GET /api/v1/contactos/{id}/comentarios
```

### Ejemplo

```bash
curl -X GET "http://localhost:3000/api/v1/contactos/123/comentarios" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

### Respuesta 200

```json
{
  "data": [
    {
      "id": "30",
      "comentario": "Cliente busca casa con jardin.",
      "fechaCreacion": "2026-07-01T20:15:00.000Z"
    }
  ]
}
```

---

## Agregar comentario

```http
POST /api/v1/contactos/{id}/comentarios
```

### Body

```json
{
  "comentario": "Cliente busca casa con jardin."
}
```

### Ejemplo

```bash
curl -X POST "http://localhost:3000/api/v1/contactos/123/comentarios" \
  -H "Authorization: Bearer crm_xxx_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "comentario": "Cliente busca casa con jardin." }'
```

### Respuesta 201

```json
{
  "data": {
    "id": "30",
    "comentario": "Cliente busca casa con jardin.",
    "fechaCreacion": "2026-07-01T20:15:00.000Z"
  }
}
```

---

## Obtener comentario

```http
GET /api/v1/contactos/{id}/comentarios/{comentarioId}
```

Regresa un comentario siempre que pertenezca al contacto indicado.

### Ejemplo

```bash
curl -X GET "http://localhost:3000/api/v1/contactos/123/comentarios/30" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

---

## Modificar comentario

```http
PATCH /api/v1/contactos/{id}/comentarios/{comentarioId}
```

### Body

```json
{
  "comentario": "Cliente ahora busca casa con jardin y 3 recamaras."
}
```

### Ejemplo

```bash
curl -X PATCH "http://localhost:3000/api/v1/contactos/123/comentarios/30" \
  -H "Authorization: Bearer crm_xxx_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "comentario": "Cliente ahora busca casa con jardin y 3 recamaras." }'
```

### Respuesta 200

```json
{
  "data": {
    "id": "30",
    "comentario": "Cliente ahora busca casa con jardin y 3 recamaras.",
    "fechaCreacion": "2026-07-01T20:15:00.000Z"
  }
}
```

---

## Quitar comentario

```http
DELETE /api/v1/contactos/{id}/comentarios/{comentarioId}
```

### Ejemplo

```bash
curl -X DELETE "http://localhost:3000/api/v1/contactos/123/comentarios/30" \
  -H "Authorization: Bearer crm_xxx_xxx"
```

### Respuesta 200

```json
{
  "data": {
    "id": "30"
  },
  "message": "Comentario eliminado."
}
```

