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
  let trafficFactor = 0.5 // Default traffic factor (0-1)
  let edgeDetails = [] // Store details of edges in the path

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

  // Function to update traffic data
  async function updateTraffic() {
    try {
      const response = await fetch("/update-traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      if (!response.ok) throw new Error("Failed to update traffic data")
      
      // Refresh city data to get the new traffic values
      await fetchCityData()
      
      // If we have a selected path, recalculate it with the new traffic
      if (selectedStart !== null && selectedEnd !== null) {
        await calculateShortestPath(selectedStart, selectedEnd)
      }
      
      return await response.json()
    } catch (error) {
      console.error("Error updating traffic:", error)
      return { success: false, error: error.message }
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
    
    // Edge color based on traffic level when in path
    let edgeColor = "#94a3b8" // Default gray
    let edgeWidth = 2
    
    if (isInPath) {
      // Find the edge details if it's in the path
      const pathDetail = edgeDetails.find(
        detail => (detail.start === edge.start && detail.end === edge.end) || 
                 (detail.start === edge.end && detail.end === edge.start)
      )
      
      if (pathDetail) {
        // Traffic-based color when in path
        if (pathDetail.traffic < 1.0) {
          edgeColor = "#22c55e" // Green for light traffic
        } else if (pathDetail.traffic < 2.0) {
          edgeColor = "#f59e0b" // Orange for medium traffic
        } else {
          edgeColor = "#ef4444" // Red for heavy traffic
        }
      } else {
        edgeColor = "#f59e0b" // Default path color if no details
      }
      
      edgeWidth = 4
    } else {
      // Color non-path edges by traffic level
      if (edge.traffic < 1.0) {
        edgeColor = "#94a3b8" // Default with slight green tint
      } else if (edge.traffic < 2.0) {
        edgeColor = "#cbd5e1" // Default with slight orange tint  
      } else {
        edgeColor = "#e2e8f0" // Default with slight red tint
      }
    }
    
    ctx.strokeStyle = edgeColor
    ctx.lineWidth = edgeWidth
    ctx.stroke()

    // Calculate midpoint with small offset to prevent overlap
    const midX = (start.x + end.x) / 2 + perpX * 10
    const midY = (start.y + end.y) / 2 + perpY * 10

    // Draw weight label with improved visibility
    ctx.fillStyle = "white"
    
    // Show both distance and traffic if edge is in path
    let weightText = edge.weight.toString()
    if (isInPath) {
      // Find the traffic info for this edge
      const pathDetail = edgeDetails.find(
        detail => (detail.start === edge.start && detail.end === edge.end) || 
                 (detail.start === edge.end && detail.end === edge.start)
      )
      
      if (pathDetail) {
        weightText = `${edge.weight} (${pathDetail.traffic.toFixed(1)}x)`
      }
    }
    
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
    ctx.fillText(weightText, midX, midY)
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

  // Setup canvas interaction for node selection
  function setupCanvasInteraction() {
    canvas.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // Detect if mouse is over a node
      let found = false
      cityData.nodes.forEach((node) => {
        const pos = nodePositions[node.id]
        if (!pos) return
        
        const dx = mouseX - pos.x
        const dy = mouseY - pos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance <= 24) { // Node size plus a bit of margin
          hoveredNode = node.id
          found = true
          canvas.style.cursor = "pointer"
        }
      })
      
      if (!found && hoveredNode !== null) {
        hoveredNode = null
        canvas.style.cursor = "default"
      }
      
      // Only redraw if the hovered node changed
      if (found || hoveredNode === null) {
        drawCityMap(cityData.nodes, cityData.edges, selectedPath)
      }
    })
    canvas.addEventListener("click", (event) => {
      if (hoveredNode !== null) {
        // If clicking on a node, update the form inputs
        
        // If start is not set, set start first
        if (selectedStart === null) {
          document.getElementById("start").value = hoveredNode
          selectedStart = hoveredNode
          
          // Remove the alert that was here
        }
        // If start is set but end is not, set end
        else if (selectedEnd === null) {
          document.getElementById("end").value = hoveredNode
          selectedEnd = hoveredNode
          
          // If both start and end are set, calculate the path automatically
          calculateShortestPath(selectedStart, selectedEnd)
        } 
        // If both are set, start a new selection (reset and set start)
        else {
          selectedStart = hoveredNode
          selectedEnd = null
          document.getElementById("start").value = hoveredNode
          document.getElementById("end").value = ""
          
          // Clear the current path
          selectedPath = []
          
          // Remove the alert that was here too
        }
        
        drawCityMap(cityData.nodes, cityData.edges, selectedPath)
      }
    })
  }

  // Function to calculate shortest path
  async function calculateShortestPath(start, end) {
    try {
      console.log(`Sending request for path from ${start} to ${end} with traffic factor ${trafficFactor}`)

      const response = await fetch("/shortest-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          start: start, 
          end: end,
          traffic_factor: trafficFactor
        }),
      })

      const data = await response.json()
      console.log("Response data:", data)

      if (data.error) {
        // Show error but don't throw
        document.getElementById("resultCard").style.display = "block"
        document.getElementById("pathResult").innerHTML = `<strong>Error:</strong> ${data.error}`
        document.getElementById("pathDistance").innerHTML = ""
        document.getElementById("resultCard").scrollIntoView({ behavior: "smooth" })
        return false
      }

      // Store edge details for visualization
      edgeDetails = data.edge_details || []

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

    // Display distance and traffic information
      let distanceInfo = ""
      if (data.distance !== undefined) {
        distanceInfo = `<strong>Effective Distance:</strong> ${data.distance.toFixed(2)}`;
        
        if (data.raw_distance !== undefined) {
          distanceInfo += `<br><strong>Raw Distance:</strong> ${data.raw_distance}`;
        }
        
        if (data.avg_traffic !== undefined) {
          distanceInfo += `<br><strong>Average Traffic:</strong> ${data.avg_traffic.toFixed(2)}x normal`;
        }
        
        document.getElementById("pathDistance").innerHTML = distanceInfo
      } else {
        document.getElementById("pathDistance").innerHTML = ""
      }

      // Scroll to result
      resultCard.scrollIntoView({ behavior: "smooth" })
      return true
    } catch (error) {
      console.error("Error calculating shortest path:", error)

      // Show error message
      document.getElementById("resultCard").style.display = "block"
      document.getElementById("pathResult").innerHTML =
        `<strong>Error:</strong> Failed to calculate shortest path. Please try again.`
      document.getElementById("pathDistance").innerHTML = ""
      document.getElementById("resultCard").scrollIntoView({ behavior: "smooth" })
      return false
    }
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

    // Update selected nodes
    selectedStart = start
    selectedEnd = end

    // Calculate path
    const success = await calculateShortestPath(start, end)

    // Reset button state
    submitButton.disabled = false
    submitButton.textContent = originalButtonText
  })

  // Add UI elements for traffic controls
  function createTrafficControls() {
    // Create container for new controls
    const formContainer = document.querySelector('.form-container')
    const trafficControls = document.createElement('div')
    trafficControls.className = 'traffic-controls'
    trafficControls.style.marginTop = '20px'
    trafficControls.style.borderTop = '1px solid #e2e8f0'
    trafficControls.style.paddingTop = '20px'
    
    // Create traffic factor slider
    const trafficFactorContainer = document.createElement('div')
    trafficFactorContainer.className = 'form-group'
    trafficFactorContainer.innerHTML = `
      <label for="trafficFactor">Traffic Importance:</label>
      <input type="range" id="trafficFactor" min="0" max="1" step="0.1" value="${trafficFactor}">
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <span>Distance Only</span>
        <span>Balanced</span>
        <span>Traffic Only</span>
      </div>
    `
    
    // Create update traffic button
    const updateTrafficButton = document.createElement('button')
    updateTrafficButton.type = 'button'
    updateTrafficButton.className = 'update-traffic-btn'
    updateTrafficButton.textContent = 'Simulate Traffic Changes'
    updateTrafficButton.style.marginTop = '15px'
    updateTrafficButton.style.backgroundColor = '#3b82f6'
    
    // Add event listeners
    const trafficSlider = trafficFactorContainer.querySelector('#trafficFactor')
    trafficSlider.addEventListener('change', async () => {
      trafficFactor = parseFloat(trafficSlider.value)
      console.log(`Traffic factor updated to: ${trafficFactor}`)
      
      // Recalculate path if we have a selected start and end
      if (selectedStart !== null && selectedEnd !== null) {
        await calculateShortestPath(selectedStart, selectedEnd)
      }
    })
    
    updateTrafficButton.addEventListener('click', async () => {
      updateTrafficButton.disabled = true
      updateTrafficButton.textContent = 'Updating Traffic...'
      
      await updateTraffic()
      
      updateTrafficButton.disabled = false
      updateTrafficButton.textContent = 'Simulate Traffic Changes'
    })
    
    // Append elements
    trafficControls.appendChild(trafficFactorContainer)
    trafficControls.appendChild(updateTrafficButton)
    formContainer.appendChild(trafficControls)
  }

  // Add explanation for traffic functionality
  function addTrafficExplanation() {
    const algorithmInfo = document.querySelector('.algorithm-info')
    if (algorithmInfo) {
      const trafficInfo = document.createElement('div')
      trafficInfo.className = 'traffic-info'
      trafficInfo.innerHTML = `
        <h3>Traffic-Aware Pathfinding</h3>
        <p>This visualization uses a modified version of Dijkstra's algorithm that accounts for both distance and traffic conditions. Each edge has a base distance (shown as a number) and a traffic multiplier that affects the effective travel time.</p>
        <p>Use the Traffic Importance slider to adjust how much weight is given to traffic conditions versus raw distance. Click "Simulate Traffic Changes" to generate new random traffic patterns across the network.</p>
        
      `
      algorithmInfo.parentNode.insertBefore(trafficInfo, algorithmInfo.nextSibling)
    }
  }

  // Initialize
  await fetchCityData()
  createTrafficControls()
  addTrafficExplanation()
})