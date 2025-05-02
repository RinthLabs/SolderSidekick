
## 📌 KiCAD Drill File Export Settings

To ensure proper alignment in the **Solder Sidekick Toolpath Editor**, your drill file must be exported from KiCAD with specific settings. These settings ensure that solder points and drill locations are positioned correctly in the toolpath canvas.

Please configure KiCAD to match the following screenshots before exporting your drill file:

### 1. Set Drill Origin to Lower-Left
Make sure the **drill origin** is set to the bottom-left corner of the board.

![KiCad Gerber Drill Origin Screenshot](/docs/kicad-place-drill-origin-combined.png)

### 2. Export with the Correct Format
When exporting drill files, use the settings shown below:

- **Use drill/place file origin**

![KiCad Gerber Drill Origin Screenshot](/docs/kicad-drill-origin.png)

- Drill File Format: **Excellon**
- Drill Origin: **Drill/place file origin**
- Units: **Inches**
- Format: **Decimal**
- Zeros Format: **Decimal Format**

![KiCad Generate Drill Files Origin Screenshot](/docs/kicad-drill-settings.png)

Click the **Generate Drill File** button to export your .drl file