import { useState, useEffect, useRef } from 'react'

const App = () => {
  const [tool, setTool] = useState('pen')
  const [size, setSize] = useState(10)
  const [color, setColor] = useState('#000000')
  const drawingRef = useRef(false)
  const canvas = useRef(null)
  const ctx = useRef(null)
  const pathsRef = useRef([])
  const undonePathsRef = useRef([])
  let cursorHTML

  const setupCanvas = () => {
    cursorHTML = document.getElementById('cursor')
    canvas.current = document.getElementById('board')
    canvas.current.width = window.innerWidth
    canvas.current.height = window.innerHeight
    ctx.current = canvas.current.getContext('2d')
    canvas.current.style.cursor = 'none'

    window.addEventListener('resize', () => {
      canvas.current.width = window.innerWidth
      canvas.current.height = window.innerHeight
      redraw()
    })
  
    document.addEventListener('mousemove', e => {
      if (cursorHTML) {
        cursorHTML.style.left = (e.clientX - (size / 2) - 1) + 'px'
        cursorHTML.style.top = (e.clientY - (size / 2) - 5) + 'px'
      }
    })
  }

  const startDrawing = (e) => {
    if (e.button !== 0) return
    drawingRef.current = true
    draw(e)
  }

  const stopDrawing = () => {
    drawingRef.current = false
    ctx.current.beginPath()
    pathsRef.current.push(ctx.current.getImageData(0, 0, canvas.current.width, canvas.current.height))
  }

  useEffect(() => {
    setupCanvas()
    canvas.current.addEventListener('mousedown', startDrawing)
    canvas.current.addEventListener('mouseup', stopDrawing)
    canvas.current.addEventListener('mousemove', draw)
    document.addEventListener('keydown', undoChanges)
    document.addEventListener('keydown', redoChanges)
    redraw()
  
    return () => {
      canvas.current.removeEventListener('mousedown', startDrawing)
      canvas.current.removeEventListener('mouseup', stopDrawing)
      canvas.current.removeEventListener('mousemove', draw)
      document.removeEventListener('keydown', undoChanges)
      document.removeEventListener('keydown', redoChanges)
    }
  }, [tool, size, color])

  const undoChanges = (e) => {
    if (e.ctrlKey && e.key === 'z') {
      if (pathsRef.current.length === 1) {
        undonePathsRef.current.push(pathsRef.current.pop())
        ctx.current.clearRect(0, 0, canvas.current.width, canvas.current.height)
      } else if (pathsRef.current.length > 1) {
        undonePathsRef.current.push(pathsRef.current.pop())
        redraw()
      } else {
        return null
      }
    }
  }

  const redoChanges = (e) => {
    if (e.ctrlKey && e.key === 'y') {
      if (undonePathsRef.current.length > 0) {
        pathsRef.current.push(undonePathsRef.current.pop())
        redraw()
      } else {
        return null
      }
    }
  }

  const updateState = (e) => {
    const {name, value} = e.target
    switch (name) {
      case 'currentTool':
        setTool(value)
        if (value === 'eraser') {
          setColor('#e8e8e8')
          ctx.current.strokeStyle = '#e8e8e8'
        } else {
          const previousColor = document.getElementById('color').value
          setColor(previousColor)
          ctx.current.strokeStyle = previousColor
          canvas.current.style.cursor = 'none'
        }
        break
      case 'size':
        setSize(value)
        ctx.current.lineWidth = value
        cursorHTML.style.width = value + 'px'
        cursorHTML.style.height = value + 'px'
        break
      case 'color':
        if (tool !== 'eraser') {
          setColor(value)
          ctx.current.strokeStyle = value
        }
        break
      default:
        break
    }
  }

  const draw = (e) => {
    if (!drawingRef.current) return
    ctx.current.lineWidth = size
    ctx.current.lineCap = 'round'
    ctx.current.strokeStyle = color
    ctx.current.lineTo(e.clientX, e.clientY)
    ctx.current.stroke()
    ctx.current.beginPath()
    ctx.current.moveTo(e.clientX, e.clientY)
  }

  const redraw = () => {
    for (let i = 0; i < pathsRef.current.length; i++) {
      ctx.current.putImageData(pathsRef.current[i], 0, 0)
    }
  }

  const clearCanvas = () => {
    ctx.current.clearRect(0, 0, canvas.current.width, canvas.current.height)
    pathsRef.current = []
    undonePathsRef.current = []
  }

  const saveImage = () => {
    const imageData = ctx.current.getImageData(0, 0, canvas.current.width, canvas.current.height)
    const pixels = imageData.data
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      if (r === 232 && g === 232 && b === 232) {
        pixels[i + 3] = 0
      }
    }
    ctx.current.putImageData(imageData, 0, 0)
    const link = document.createElement('a')
    link.download = 'mySketch.png'
    link.href = canvas.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className='appContainer'>
      <div id='cursor'></div>
      <div className='boardTab'>
        <div className='menu'>
          <div className='menuTitle'>
            <img className='menuTitleImg' src='./logo.svg' alt='logo' />
            <h1 className='title'>visor</h1>
          </div>
          <hr />
          <div className='menuControl'>
            <label>Choose a tool</label>
            <div className='toolsContainer'>
              <input type='radio' id='pen' name='currentTool' value='pen' onClick={updateState} defaultChecked />
              <label className='toolLabel' htmlFor='pen'><img src='./pen.svg' alt='pen' /></label>
              <input type='radio' id='eraser' name='currentTool' value='eraser' onClick={updateState} />
              <label className='toolLabel' htmlFor='eraser'><img src='./eraser.svg' alt='eraser' /></label>
            </div>
          </div>
          <div className='menuControl'>
            <label>Choose a size</label>
            <p>{size}</p>
            <input id='size' name='size' type='range' min='1' max='100' value={size} onChange={updateState} />
          </div>
          <div className='menuControl'>
            <label>Choose a color</label>
            <input id='color' name='color' type='color' onChange={updateState} />
          </div>
          <hr />
          <button className='resetButton' onClick={clearCanvas}>Reset board</button>
          <button className='saveButton' onClick={saveImage}>Save as image</button>
        </div>
      </div>
      <canvas id='board'></canvas>
    </div>
  )
}

export default App