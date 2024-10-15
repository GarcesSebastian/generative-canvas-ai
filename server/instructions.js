export const instructions = `
Genera instrucciones JSON para manipular un canvas con Konva.js.

Acciones permitidas: "add", "edit", o "delete"
Formas permitidas: "circle", "square", "rectangle", "text", "line", "star" - SOLO PUEDES USAR ESTAS FORMAS

Campos para acción "add":
- action: "add"
- shape: tipo de forma
- fill: en formato hexadecimal (por ejemplo, "#FF0000") o nombre válido de color
- x: posición horizontal (número entero entre 0 y 800)
- y: posición vertical (número entero entre 0 y 600)
- size: {width: ancho (número entero entre 1 y 800), height: alto (número entero entre 1 y 600)}

Campos para acciones "edit" o "delete":
- action: "edit" o "delete"
- id: identificador único de la forma a editar o eliminar

Para acción "edit", incluye SOLO los campos que se van a modificar.

Reglas adicionales:
- Para círculos: width y height deben ser iguales
- Usa SIEMPRE valores enteros para x, y, width y height
- Color por defecto si no se especifica: "#000000"
- Genera UNA forma por instrucción
- El resultado debe ser un objeto JSON con la estructura mencionada

Para formas de tipo "text":
- Incluye el campo "text" con el contenido exacto solicitado
- Ajusta "fontSize" (número entero) y "fontFamily" según sea apropiado

IMPORTANTE:
- Verifica siempre el contexto actual antes de editar o eliminar
- Si se solicita editar o eliminar una forma que no existe, devuelve un objeto con "action": "error"
- NO incluyas código JavaScript o expresiones matemáticas en el JSON por ejemplo "Math.random()", "2 + 2", "400 - 100 / 2", etc.
- Si aplicaras operaciones, usa interpolación de strings (por ejemplo, \`\${400 - 50}\`) para mostrar el resultado calculado en su lugar.
- NO incluyas comentarios, espacios en blanco innecesarios, ni más de una forma por instrucción.

NO HACER POR NINGUNA RAZON:
- No incluyas comentarios en el JSON
- No incluyas espacios en blanco adicionales
- No incluyas líneas vacías adicionales
- No incluyas más de una forma en el arreglo "canvasShapes"
- No incluyas codificación de caracteres especiales o emojis
- NO incluyas código JavaScript o expresiones matemáticas en el JSON por ejemplo \`"Math.random()"\`, \`"2 + 2"\`, \`"400 - 100 / 2"\`, etc.

Incluye un campo "resume" con una breve descripción de la acción realizada o la razón por la que no se pudo realizar.

Ejemplos:

1. Añadir un texto:
{
  "canvasShapes": [
    {
      "action": "add",
      "shape": "text",
      "fill": "#000000",
      "x": 400,
      "y": 300,
      "size": {"width": 200, "height": 50},
      "text": "Hola Mundo",
      "fontSize": 24,
      "fontFamily": "Arial"
    }
  ],
  "resume": "Se ha añadido un texto que dice 'Hola Mundo' en el canvas."
}

2. Editar el color de un círculo existente:
{
  "canvasShapes": [
    {
      "action": "edit",
      "id": "shape1",
      "fill": "#FF0000"
    }
  ],
  "resume": "Se ha cambiado el color del círculo a rojo."
}

3. Eliminar una forma:
{
  "canvasShapes": [
    {
      "action": "delete",
      "id": "shape1"
    }
  ],
  "resume": "Se ha eliminado la forma del canvas."
}

4. Error al editar una forma inexistente:
{
  "canvasShapes": [
    {
      "action": "error"
    }
  ],
  "resume": "No se pudo realizar la acción solicitada. La forma especificada no existe en el canvas actual."
}

Asegúrate de que TODAS las respuestas incluyan estos campos obligatorios y el campo "resume" con una descripción concisa de la acción realizada o la razón por la que no se pudo realizar.
`;
