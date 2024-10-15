import Konva from 'konva';

let nextId = 1;
const stage = new Konva.Stage({
    container: 'container',
    width: 800,
    height: 600,
});

const elements = []

const layer = new Konva.Layer();
stage.add(layer);

function generateId() {
    return `shape${nextId++}`;
}

function getCanvasSummary() {
    return stage.find('Shape').map(shape => ({
        id: shape.id(),
        shape: shape.getClassName(),
        fill: shape.fill(),
        x: shape.x(),
        y: shape.y(),
        width: shape.width(),
        height: shape.height(),
        rotation: shape.rotation()
    }));
}

export async function generateCanvas(prompt){
    const canvasSummary = getCanvasSummary();

    const response = await fetch('http://localhost:3000/generate-canvas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, canvasSummary }),
    });

    const result = await response.json();
    applyCanvasChanges(result.canvasShapes);
    console.log(result.resume);
}

document.getElementById('prompt-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const prompt = document.getElementById('prompt').textContent;
    generateCanvas(prompt);
});

function applyCanvasChanges(changes) {
    changes.forEach(change => {
        switch (change.action) {
            case 'add':
                addShape(change);
                break;
            case 'edit':
                editShape(change);
                break;
            case 'delete':
                deleteShape(change.id);
                break;
        }
    });
    layer.draw();
}

function addShape(instruction) {
    let shape;
    console.log('Adding shape', instruction);
    const commonProps = {
        id: generateId(),
        x: instruction.x,
        y: instruction.y,
        fill: instruction.fill,
        rotation: instruction.rotation || 0,
        width: instruction.size.width,
        height: instruction.size.height,
    };

    switch (instruction.shape) {
        case 'circle':
            shape = new Konva.Circle({
                ...commonProps,
                radius: instruction.size.width / 2,
            });
            break;
        case 'square':
        case 'rectangle':
            shape = new Konva.Rect(commonProps);
            break;
        case 'text':
            shape = new Konva.Text({
                ...commonProps,
                text: instruction.text,
                fontSize: instruction.fontSize,
                fontFamily: instruction.fontFamily,
            });
            break;
        case 'line':
            shape = new Konva.Line({
                ...commonProps,
                points: [0, 0, instruction.size.width, instruction.size.height],
                stroke: instruction.fill,
            });
            break;
        case 'star':
            shape = new Konva.Star({
                ...commonProps,
                numPoints: 5,
                innerRadius: instruction.size.width / 4,
                outerRadius: instruction.size.width / 2,
            });
            break;
    }

    if (shape) {
        console.log('Adding shape', shape);
        layer.add(shape);
        elements.push(shape);
    }
}

function editShape(instruction) {
    const shape = stage.findOne('#' + instruction.id);
    if (shape) {
        shape.setAttrs(instruction);
    }
}

function deleteShape(id) {
    elements.forEach((element, index) => {
        console.log('Checking element', element.id(), id);
        if (element.id() === id) {
            element.destroy();
            elements.splice(index, 1);
        }
    });
    const shape = stage.findOne('#' + id);
    if (shape) {
        shape.destroy();
    }
}