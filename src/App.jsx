import React, { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";

function App() {
  const canvas = useRef(null);
  let mousePressed = false;

  // ** Brush setting
  let brushColor = "#e63946";
  let brushWidth = 10;

  const brushOptions = {
    colors: [
      {
        display: "red",
        value: "#e63946",
      },
      {
        display: "blue",
        value: "#0081a7",
      },
      {
        display: "yellow",
        value: "#ffbe0b",
      },
    ],
    width: [3, 5, 7, 10, 15],
  };
  const hanleChangeBrushColor = (e) => {
    const value = e.target.value;
    canvas.current.freeDrawingBrush.color = value;
    canvas.current.renderAll();
  };
  const hanleChangeBrushWidth = (e) => {
    const value = e.target.value;
    canvas.current.freeDrawingBrush.width = parseInt(value, 10);
    canvas.current.renderAll();
  };

  // ** End of -> Brush setting

  // ** Change modes
  let currentMode = "default";

  const resetMode = () => {
    canvas.current.isDrawingMode = false;
  };

  const modes = {
    pan: {
      value: "pan",
      handle: (event) => {
        if (!mousePressed) return;

        canvas.current.setCursor("grab");
        canvas.current.renderAll();

        const mEvent = event.e;
        const delta = new fabric.Point(mEvent.movementX, mEvent.movementY);

        canvas.current.relativePan(delta);
      },
      handleMouseDown: () => {
        canvas.current.setCursor("grab");
        canvas.current.renderAll();
      },
      handleMouseUp: () => {
        canvas.current.setCursor("default");
        canvas.current.renderAll();
      },
    },
    drawing: {
      value: "drawing",
      handle: (event) => {
        canvas.current.isDrawingMode = true;
        canvas.current.renderAll();
      },
      handleMouseDown: () => {
        canvas.current.setCursor("default");
        canvas.current.renderAll();
      },
      handleMouseUp: () => {
        canvas.current.setCursor("default");
        canvas.current.renderAll();
      },
    },
    default: {
      value: "default",
      handle: (event) => {},
      handleMouseDown: () => {
        canvas.current.setCursor("default");
        canvas.current.renderAll();
      },
      handleMouseUp: () => {
        canvas.current.setCursor("default");
        canvas.current.renderAll();
      },
    },
  };

  const handleChangeMode = (mode = "default") => {
    resetMode();
    currentMode = modes[mode].value;
  };
  // ** End of -> Change modes

  // ** Init canvas
  useEffect(() => {
    canvas.current = initCanvas();

    hanleLoadAndSetImageFromUrl(canvas.current, imageUrl);

    canvas.current.freeDrawingBrush.color = brushColor;
    canvas.current.freeDrawingBrush.width = parseInt(brushWidth, 10);

    canvas.current.on("mouse:move", handleMouseMove);
    canvas.current.on("mouse:down", handleMouseDown);
    canvas.current.on("mouse:up", handleMouseUp);

    // destroy fabric on unmount
    return () => {
      canvas.current.dispose();
      canvas.current = null;
    };
  }, []);

  const initCanvas = () =>
    new fabric.Canvas("canvas", {
      height: 500,
      width: 500,
      backgroundColor: "pink",
      selection: false,
    });
  // ** End of  -> Init canvas

  // ** Load and set image from url
  const imageUrl =
    "https://images.unsplash.com/photo-1663417026017-dd3933e19074?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwyMnx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=60";

  const hanleLoadAndSetImageFromUrl = (canvasContainer, imageUrl) => {
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        if (img == null) return alert("error when load image");

        canvasContainer.backgroundImage = img;
        canvasContainer.renderAll();
      },
      { crossOrigin: "anonymous" }
    );
  };

  // ** End of -> Add image from url

  // ** Events of canvas

  const handleMouseMove = (event) => {
    modes[currentMode].handle(event);
  };
  const handleMouseDown = () => {
    mousePressed = true;
    modes[currentMode].handleMouseDown();
  };
  const handleMouseUp = () => {
    mousePressed = false;
    modes[currentMode].handleMouseUp();
  };
  // ** End of ->Events of canvas

  // ** Handle clear
  const handleClear = () => {
    canvas.current.getObjects().map((item) => {
      if (item !== canvas.current.backgroundImage) {
        canvas.current.remove(item);
      }
    });
  };
  // ** End of -> Handle clear

  // ** Add objects
  const objectsList = [
    {
      display: "circle",
      value: "circle"
    },
    {
      display: "rectangle",
      value: "rectangle"
    },
  ];

  const objectsHandleList = {
    circle : {
      handle: () => {
        const canvCenter = canvas.current.getCenter();
        const circle = new fabric.Circle({
          radius: 100,
          fill: 'blue',
          originX: 'center',
          originY: 'center',
          ...canvCenter,
          top: -50
        })

        canvas.current.add(circle)
        canvas.current.renderAll()
        circle.animate('top', canvas.current.height - 100, {
          onChange: canvas.current.renderAll.bind(canvas.current),
          onComplete: () => {
            circle.animate('top', canvCenter.top, {
              onChange: canvas.current.renderAll.bind(canvas.current),
              easing: fabric.util.ease.easeOutBounce,
              duration: 500
            })
          }
        });
      }
    },
    rectangle : {
      handle: () => {
        const canvCenter = canvas.current.getCenter();
        const rect = new fabric.Rect({
          width: 200,
          height:100,
          fill: 'yellow',
          originX: 'center',
          originY: 'center',
          ...canvCenter,
          top: -50,
          // objectCaching: false
        })

        canvas.current.add(rect)
        canvas.current.renderAll()
        rect.animate('top', canvCenter.top, {
          onChange: canvas.current.renderAll.bind(canvas.current)
        });
        rect.on('selected', () =>{
          rect.set('fill','white')
          canvas.current.renderAll();
        })
        rect.on('deselected', () =>{
          rect.set('fill','yellow')
          canvas.current.renderAll();
        })
        
      }
    }
  } 
  
  const handleAddObject = (value) => {
    objectsHandleList[value].handle();
  }

  // ** End of -> Add objects

  // ** Group and ungroup objects
  const group = {};
  const handleGroupObject = (canvas, group, shoudGroup) => {
      if(shoudGroup){
        const objects = canvas.getObjects()
        group.val = new fabric.Group(objects);
        handleClear()
        canvas.add(group.val)
        canvas.requestRenderAll()
      }
      else {
        group.val.destroy();
        const oldGroup = group.val.getObjects();
        canvas.remove(group.val);
        canvas.add(...oldGroup);
        canvas.requestRenderAll();
        group.val = null;
      }
  }
  // ** End of -> Group and ungroup objects

  return (
    <div>
      <button onClick={() => handleChangeMode()}>NORMAL</button>
      <button onClick={() => handleChangeMode("pan")}>PAN</button>
      <button onClick={() => handleChangeMode("drawing")}>DRAWING</button>
      <button onClick={()=> handleGroupObject(canvas.current, group, true)}>GROUP</button>
      <button onClick={()=> handleGroupObject(canvas.current, group, false)}>UNGROUP</button>

      <select onChange={(e) => hanleChangeBrushColor(e)}>
        {brushOptions.colors.map((item, index) => (
          <option key={index} value={item.value}>
            {item.display}
          </option>
        ))}
      </select>
      <select onChange={(e) => hanleChangeBrushWidth(e)} value={brushWidth}>
        {brushOptions.width.map((item, index) => (
          <option value={item} key={index}>
            {item}
          </option>
        ))}
      </select>
      <button onClick={() => handleClear()}>CLEAR</button>
      <canvas id="canvas" ref={canvas} />
      <h2>objects</h2>

      {objectsList.map((item, index) => (
        <button key={index} onClick={() => handleAddObject(item.value)}>{item.display}</button>
      ))}
      
    </div>
  );
}

export default App;
