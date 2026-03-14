# Livery-Injector

## How to Install
Install a Userscript Manager: Download Tampermonkey or Violentmonkey for your browser (Chrome, Edge, or Firefox).

Create New Script: Open your manager's dashboard and click "Create a new script."

Paste the Code: Delete any default text and paste the entire Main.js code.

Save: Press Ctrl+S or click File > Save.

## How to Use
1. ### Opening the Menu
   
  Once the game loads, look for the Livery Icon. Click it to toggle the control panel.

2. ### Adding a Livery
   
  Spawn in the aircraft you want to customize (e.g., the Boeing 737).

Open the Livery Injector panel.

Click "Choose File" and select a texture image (.png or .jpg) from your computer.

Click "Save & Load".

The livery is now saved to your permanent "Cloud" and applied to the aircraft.

3. ### Managing Your Gallery
   
  Search: Use the search bar to find specific liveries by filename.
  
  Switching: Simply click any livery name in the list to apply it instantly.
  
  Deleting: Click the red "×" next to a livery to remove it from your storage.
  
  Smart Mode: If the livery looks "broken" or covers the cockpit windows incorrectly, toggle Smart Mode and re-apply the livery.

4. ### Backups
   
  Export: Click the Export .json button to download a file containing all your saved textures.
  
  Import: Use the Import .json button to restore a previously saved backup file.
  
  Wipe: Use the Delete All button to clear all data and reset the database (Warning: This cannot be undone).

## Technical Notes
Most browsers allow up to 500MB+ for IndexedDB, but it is recommended to keep an eye on the "Storage" readout at the bottom of the panel.

Designed for GeoFS v3.0+, but includes fallback support for older versions.
