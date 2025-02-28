<template>
  <div class="container mt-4">
    <h2 class="text-primary">Drill Hole Preview (D3.js)</h2>

    <!-- Origin Position Inputs -->
    <div class="mb-3">
      <label class="form-label">Origin X:</label>
      <input type="number" class="form-control d-inline w-auto mx-2" v-model.number="origin.x" @input="updateOrigin" />
      <label class="form-label">Origin Y:</label>
      <input type="number" class="form-control d-inline w-auto mx-2" v-model.number="origin.y" @input="updateOrigin" />
    </div>

    <!-- Toolbar -->
    <div class="mb-3">
      <button class="btn btn-primary" @click="selectAll">Select All</button>
      <button class="btn btn-secondary ms-2" @click="deselectAll">Deselect All</button>
      <button class="btn btn-success ms-2" @click="setSelectedSolder(true)">Set Selected as Soldered</button>
      <button class="btn btn-danger ms-2" @click="setSelectedSolder(false)">Set Selected as Not Soldered</button>
    </div>

    <!-- D3.js Canvas -->
    <div ref="svgContainer" class="svg-container" @contextmenu.prevent></div>

    <!-- Table for drill points -->
    <table v-if="drillStore.drillData.length" class="table table-striped mt-3">
      <thead class="table-dark">
        <tr>
          <th>Solder</th>
          <th>Tool</th>
          <th>Size (mm)</th>
          <th>X (mm)</th>
          <th>Y (mm)</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(drill, index) in drillStore.drillData"
          :key="index"
          :class="{ 'selected-row': drill.selected, 'unselected-row': !drill.selected }"
        >
          <td>
            <input type="checkbox" v-model="drill.solder" @change="updateDrillPoints" />
          </td>
          <td>{{ drill.tool }}</td>
          <td>{{ drill.size ? drill.size.toFixed(2) : 'Unknown' }}</td>
          <td>{{ drill.x }}</td>
          <td>{{ drill.y }}</td>
        </tr>
      </tbody>
    </table>

    <button class="btn btn-success mt-3" @click="exportSelectedHoles">Export Selected Holes</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import * as d3 from "d3";
import { useDrillStore } from "@/stores/drillStore";

const drillStore = useDrillStore();
const svgContainer = ref(null);
const origin = ref({ x: 0, y: 0 });

const printBedSize = 235; // Ender3 bed size
const gridSize = 0.25; // ✅ Snapping interval for origin
let svg, zoomGroup, originMarker, selectionBox;
let isSelecting = false, selectionStart, selectionEnd;
let transform = d3.zoomIdentity; // ✅ Tracks current zoom & pan state

// **Update Origin Marker**
const updateOriginMarker = () => {
  if (!originMarker) return;
  originMarker.attr("cx", parseFloat(origin.value.x)).attr("cy", -parseFloat(origin.value.y));
};

// **Initialize D3.js Scene**
onMounted(() => {
  initD3();
  updateDrillPoints();
});

// **Initialize D3 Canvas**
const initD3 = () => {
  svg = d3.select(svgContainer.value)
    .append("svg")
    .attr("width", 800)
    .attr("height", 500)
    .on("contextmenu", (event) => event.preventDefault()) // ✅ Prevent right-click menu
    .call(
      d3.zoom()
        .scaleExtent([0.5, 5])
        .filter((event) => event.type === "wheel" || event.button === 2) // ✅ Right-click to pan, wheel to zoom
        .on("zoom", (event) => {
          transform = event.transform;
          zoomGroup.attr("transform", transform);
        })
    )
    .on("mousedown", startSelection)
    .on("mousemove", updateSelection)
    .on("mouseup", endSelection)
    .append("g");

  zoomGroup = svg.append("g");

  // **Draw Print Bed (Bottom-left at 0,0)**
  zoomGroup.append("rect")
    .attr("x", 0)
    .attr("y", -printBedSize)
    .attr("width", printBedSize)
    .attr("height", printBedSize)
    .attr("fill", "#e0e0e0")
    .attr("stroke", "black");

  // **Add Draggable Origin Marker**
  originMarker = zoomGroup.append("circle")
    .attr("r", 5)
    .attr("fill", "blue")
    .attr("stroke", "black")
    .attr("cursor", "pointer")
    .call(d3.drag().on("drag", draggedOrigin));

  updateOriginMarker();
};

// **Handle Drag Selection**
const startSelection = (event) => {
  if (event.button !== 0) return; // Only allow left-click for selection

  isSelecting = true;
  selectionStart = transform.invert(d3.pointer(event, svg.node()));

  selectionBox = zoomGroup.append("rect")
    .attr("class", "selection-box")
    .attr("stroke", "blue")
    .attr("stroke-dasharray", "4")
    .attr("fill", "rgba(0, 0, 255, 0.2)");
};

const updateSelection = (event) => {
  if (!isSelecting) return;
  
  selectionEnd = transform.invert(d3.pointer(event, svg.node()));

  const x = Math.min(selectionStart[0], selectionEnd[0]);
  const y = Math.min(selectionStart[1], selectionEnd[1]);
  const width = Math.abs(selectionEnd[0] - selectionStart[0]);
  const height = Math.abs(selectionEnd[1] - selectionStart[1]);

  selectionBox.attr("x", x).attr("y", y).attr("width", width).attr("height", height);
};

const endSelection = () => {
  if (!isSelecting) return;
  isSelecting = false;

  zoomGroup.selectAll(".drill").each(function (d, i) {
    const cx = parseFloat(d3.select(this).attr("cx"));
    const cy = parseFloat(d3.select(this).attr("cy"));

    if (cx >= selectionStart[0] && cx <= selectionEnd[0] && cy >= selectionStart[1] && cy <= selectionEnd[1]) {
      drillStore.drillData[i].selected = true;
    }
  });

  selectionBox.remove();
  updateDrillPoints();
};

// **Update Drill Holes**
const updateDrillPoints = () => {
  if (!zoomGroup) return;
  zoomGroup.selectAll(".drill").remove();

  zoomGroup.selectAll(".drill")
    .data(drillStore.drillData)
    .enter()
    .append("circle")
    .attr("class", "drill")
    .attr("r", 2)
    .attr("fill", (d) => (d.solder ? "red" : "gray"))
    .attr("stroke", (d) => (d.selected ? "cyan" : "black"))
    .attr("cx", (d) => parseFloat(d.x) + parseFloat(origin.value.x))
    .attr("cy", (d) => -parseFloat(d.y) - parseFloat(origin.value.y));
};

// **Watch for Updates**
watch(origin, updateDrillPoints);
watch(() => drillStore.drillData, updateDrillPoints, { deep: true });

</script>

<style>
.svg-container {
  width: 800px;
  height: 500px;
  border: 1px solid #ddd;
  background-color: white;
}

.selection-box {
  stroke-width: 1;
}

.selected-row {
  background-color: cyan !important;
}

.unselected-row {
  background-color: white !important;
}
</style>
