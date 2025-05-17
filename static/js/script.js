document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script.js is loaded!")

  const canvas = document.getElementById("cityMap")
  const ctx = canvas.getContext("2d")

  // Make canvas responsive
  function resizeCanvas() {
    const container = canvas.parentElement
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }

  window.addEventListener("resize", () => {
    resizeCanvas()
    if (cityData) {
      drawCityMap(cityData.nodes, cityData.edges, selectedPath)
    }
  })

  resizeCanvas()

  let cityData = null
  const nodePositions = {}
  let selectedStart = null
  let selectedEnd = null
  let selectedPath = []
  let hoveredNode = null

  // Fetch city data from the backend
  async function fetchCityData() {
    try {
      const response = await fetch("/city-data")
      if (!response.ok) throw new Error("Failed to fetch city data")
      cityData = await response.json()
      console.log("City Data:", cityData)
      calculateNodePositions()
      drawCityMap(cityData.nodes, cityData.edges, [])
      setupCanvasInteraction()
    } catch (error) {
      console.error("Error fetching city data:", error)
    }
  }

  function calculateNodePositions() {
  const padding = 80  // Increased padding from edges of canvas
  const availableWidth = canvas.width - padding * 2
  const availableHeight = canvas.height - padding * 2
  
  // Create completely random positions across the entire canvas
  cityData.nodes.forEach((node) => {
    // Generate random position within the available area
    const x = padding + Math.random() * availableWidth
    const y = padding + Math.random() * availableHeight
    
    nodePositions[node.id] = { x, y }
  })
  
  // Run a simple force-directed algorithm to prevent nodes from overlapping too much
  const iterations = 50
  const minDistance = 100  // Minimum desired distance between nodes
  
  for (let i = 0; i < iterations; i++) {
    const forces = {}
    
    // Initialize forces
    cityData.nodes.forEach(node => {
      forces[node.id] = { x: 0, y: 0 }
    })
    
    // Calculate repulsive forces between all node pairs
    for (let j = 0; j < cityData.nodes.length; j++) {
      const nodeA = cityData.nodes[j]
      const posA = nodePositions[nodeA.id]
      
      for (let k = j + 1; k < cityData.nodes.length; k++) {
        const nodeB = cityData.nodes[k]
        const posB = nodePositions[nodeB.id]
        
        const dx = posB.x - posA.x
        const dy = posB.y - posA.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < minDistance) {
          // Calculate repulsive force (inverse square law)
          const force = (minDistance - distance) / distance * 0.1
          const fx = dx * force
          const fy = dy * force
          
          // Apply force in opposite directions
          forces[nodeA.id].x -= fx
          forces[nodeA.id].y -= fy
          forces[nodeB.id].x += fx
          forces[nodeB.id].y += fy
        }
      }
    }
    
    // Apply forces to node positions
    cityData.nodes.forEach(node => {
      const force = forces[node.id]
      const pos = nodePositions[node.id]
      
      pos.x += force.x
      pos.y += force.y
      
      // Keep nodes within bounds
      pos.x = Math.max(padding, Math.min(canvas.width - padding, pos.x))
      pos.y = Math.max(padding, Math.min(canvas.height - padding, pos.y))
    })
  }
}

  function drawCityMap(nodes, edges, pathEdges) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Draw edges first so they're behind nodes
  edges.forEach((edge) => {
    const start = nodePositions[edge.start]
    const end = nodePositions[edge.end]

    if (!start || !end) return

    const isInPath = pathEdges.some(
      (pathEdge) =>
        (pathEdge.start === edge.start && pathEdge.end === edge.end) ||
        (pathEdge.start === edge.end && pathEdge.end === edge.start),
    )

    // Calculate edge direction vector
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    // Normalized direction vector
    const ndx = dx / length
    const ndy = dy / length
    
    // Perpendicular vector for label offset
    const perpX = -ndy
    const perpY = ndx
    
    // Draw the edge
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.strokeStyle = isInPath ? "#f59e0b" : "#94a3b8"
    ctx.lineWidth = isInPath ? 4 : 2
    ctx.stroke()

    // Calculate midpoint with small offset to prevent overlap
    const midX = (start.x + end.x) / 2 + perpX * 10
    const midY = (start.y + end.y) / 2 + perpY * 10

    // Draw weight label with improved visibility
    ctx.fillStyle = "white"
    const weightText = edge.weight.toString()
    const textWidth = ctx.measureText(weightText).width
    
    // Draw rounded rectangle background
    const labelPadding = 6
    const labelWidth = textWidth + labelPadding * 2
    const labelHeight = 20
    const cornerRadius = 10
    
    ctx.beginPath()
    ctx.moveTo(midX - labelWidth/2 + cornerRadius, midY - labelHeight/2)
    ctx.arcTo(midX + labelWidth/2, midY - labelHeight/2, midX + labelWidth/2, midY + labelHeight/2, cornerRadius)
    ctx.arcTo(midX + labelWidth/2, midY + labelHeight/2, midX - labelWidth/2, midY + labelHeight/2, cornerRadius)
    ctx.arcTo(midX - labelWidth/2, midY + labelHeight/2, midX - labelWidth/2, midY - labelHeight/2, cornerRadius)
    ctx.arcTo(midX - labelWidth/2, midY - labelHeight/2, midX + labelWidth/2, midY - labelHeight/2, cornerRadius)
    
    // Add shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    // Fill with solid color based on path status
    ctx.fillStyle = isInPath ? "#fef3c7" : "white"
    ctx.fill()
    
    // Add border
    ctx.strokeStyle = isInPath ? "#f59e0b" : "#cbd5e1"
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Clear shadow for text
    ctx.shadowColor = 'transparent'
    
    // Draw the weight number
    ctx.fillStyle = isInPath ? "#b45309" : "#475569"
    ctx.font = "bold 12px Inter"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(edge.weight, midX, midY)
  })

  // Draw nodes
  nodes.forEach((node) => {
    const pos = nodePositions[node.id]
    if (!pos) return

    const isStart = selectedStart === node.id
    const isEnd = selectedEnd === node.id
    const isHovered = hoveredNode === node.id
    const nodeSize = isHovered ? 24 : 22
    
    // Add shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Node background glow for selected nodes
    if (isStart || isEnd || isHovered) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, nodeSize + 6, 0, Math.PI * 2)
      ctx.fillStyle = isStart ? "rgba(16, 185, 129, 0.3)" : 
                      isEnd ? "rgba(249, 115, 22, 0.3)" : 
                      "rgba(79, 70, 229, 0.3)"
      ctx.fill()
    }
    
    // Node circle with gradient
    const gradient = ctx.createRadialGradient(
      pos.x - nodeSize/3, pos.y - nodeSize/3, 0,
      pos.x, pos.y, nodeSize
    )
    
    if (isStart) {
      gradient.addColorStop(0, "#34d399")
      gradient.addColorStop(1, "#059669")
    } else if (isEnd) {
      gradient.addColorStop(0, "#fb923c")
      gradient.addColorStop(1, "#ea580c")
    } else {
      gradient.addColorStop(0, "#818cf8")
      gradient.addColorStop(1, "#4338ca")
    }

    ctx.beginPath()
    ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    
    // Node border
    if (isHovered) {
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // Remove shadow for text
    ctx.shadowColor = 'transparent'
    
    // Node ID label
    ctx.fillStyle = "white"
    ctx.font = "bold 14px Inter"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(node.id, pos.x, pos.y)
    
    // Node name with background for better readability
    const nodeName = node.name || `Node ${node.id}`
    const nameWidth = ctx.measureText(nodeName).width
    
    // Add background for name
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(pos.x - nameWidth/2 - 4, pos.y + 20, nameWidth + 8, 18)
    
    // Draw name
    ctx.fillStyle = "#0f172a"
    ctx.font = "bold 12px Inter"
    ctx.fillText(nodeName, pos.x, pos.y + 29)
  })
}

  // Form submission
  document.getElementById("shortestPathForm").addEventListener("submit", async function (event) {
    event.preventDefault()

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]')
    const originalButtonText = submitButton.textContent
    submitButton.disabled = true
    submitButton.textContent = "Calculating..."

    const start = Number.parseInt(document.getElementById("start").value)
    const end = Number.parseInt(document.getElementById("end").value)

    if (isNaN(start) || isNaN(end)) {
      alert("Please enter valid node numbers")
      submitButton.disabled = false
      submitButton.textContent = originalButtonText
      return
    }

    try {
      console.log(`Sending request for path from ${start} to ${end}`)

      const response = await fetch("/shortest-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: start, end: end }),
      })

      const data = await response.json()
      console.log("Response data:", data)

      // Reset button state
      submitButton.disabled = false
      submitButton.textContent = originalButtonText

      if (data.error) {
        // Show error but don't throw
        document.getElementById("resultCard").style.display = "block"
        document.getElementById("pathResult").innerHTML = `<strong>Error:</strong> ${data.error}`
        document.getElementById("pathDistance").innerHTML = ""
        document.getElementById("resultCard").scrollIntoView({ behavior: "smooth" })
        return
      }

      // Update selected nodes
      selectedStart = start
      selectedEnd = end

      // Create path edges
      selectedPath = []
      if (data.path && data.path.length > 1) {
        for (let i = 0; i < data.path.length - 1; i++) {
          selectedPath.push({
            start: data.path[i],
            end: data.path[i + 1],
          })
        }
      }

      // Redraw map with path
      drawCityMap(cityData.nodes, cityData.edges, selectedPath)

      // Show result
      const resultCard = document.getElementById("resultCard")
      resultCard.style.display = "block"

      // Format path with node names
      let pathText = ""
      if (data.path && data.path.length > 0) {
        pathText = data.path
          .map((nodeId) => {
            const node = cityData.nodes.find((n) => n.id === nodeId)
            return node ? `${node.name} (${nodeId})` : nodeId
          })
          .join(" → ")
        document.getElementById("pathResult").innerHTML = `<strong>Shortest Path:</strong> ${pathText}`
      } else {
        document.getElementById("pathResult").innerHTML = "<strong>No path found</strong> between these nodes."
      }

      if (data.distance !== undefined) {
        document.getElementById("pathDistance").innerHTML = `<strong>Total Distance:</strong> ${data.distance}`
      } else {
        document.getElementById("pathDistance").innerHTML = ""
      }

      // Scroll to result
      resultCard.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("Error calculating shortest path:", error)

      // Reset button state
      submitButton.disabled = false
      submitButton.textContent = originalButtonText

      // Show error message
      document.getElementById("resultCard").style.display = "block"
      document.getElementById("pathResult").innerHTML =
        `<strong>Error:</strong> Failed to calculate shortest path. Please try again.`
      document.getElementById("pathDistance").innerHTML = ""
      document.getElementById("resultCard").scrollIntoView({ behavior: "smooth" })
    }
  })

  // Initialize
  await fetchCityData()
})