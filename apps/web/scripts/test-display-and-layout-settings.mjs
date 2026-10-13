import { displaySettings } from '../src/shared/theme/DisplaySettings.ts';
import { sidebarSettings } from '../src/shared/theme/SidebarSettings.ts';

console.log('=== UNIVERSAL UI CUSTOMIZATION & DISPLAY ENGINE VERIFICATION TEST ===');

// 1. Layer 1 Display Settings Test
console.log('[Test 1] Display Settings State & Font/Accent Updates');
const initialDisplay = displaySettings.getState();
console.log(' - Initial Zoom Scale:', initialDisplay.zoomScale);
console.log(' - Initial Font Family:', initialDisplay.fontFamily);
console.log(' - Initial Accent Color:', initialDisplay.accentColor);

displaySettings.setAccentColor('#FF00FF', '255, 0, 255');
displaySettings.setZoomScale(1.15);
displaySettings.setFpsCap(120);

const updatedDisplay = displaySettings.getState();
if (updatedDisplay.accentColor !== '#FF00FF' || updatedDisplay.zoomScale !== 1.15 || updatedDisplay.fpsCap !== 120) {
  console.error('FAIL: Display settings state update failed');
  process.exit(1);
}
console.log(' ✓ Display settings state updated successfully.');

// 2. Layer 4 Consolidated Typography Category Scale Test
console.log('[Test 2] Consolidated Typography Scales');
displaySettings.setCategoryTextScale('sidebarTextScale', 1.25);
displaySettings.setCategoryTextScale('chartTextScale', 0.85);

const updatedScales = displaySettings.getState().categoryScales;
if (updatedScales.sidebarTextScale !== 1.25 || updatedScales.chartTextScale !== 0.85) {
  console.error('FAIL: Typography scale update failed');
  process.exit(1);
}
console.log(' ✓ Category typography scales updated successfully.');

// 3. Layer 3 Sidebar Customization Test
console.log('[Test 3] Sidebar Customization Manager');
const initialSidebar = sidebarSettings.getState();
console.log(' - Initial Sidebar Width:', initialSidebar.sidebarWidthPx);
console.log(' - Initial Item Count:', initialSidebar.itemOrder.length);

sidebarSettings.updateState({ sidebarWidthPx: 240 });
sidebarSettings.toggleItemVisibility('devices');
sidebarSettings.moveItem('trading', 'up');

const updatedSidebar = sidebarSettings.getState();
if (updatedSidebar.sidebarWidthPx !== 240 || !updatedSidebar.hiddenItems['devices']) {
  console.error('FAIL: Sidebar settings update failed');
  process.exit(1);
}
console.log(' ✓ Sidebar width & item visibility updated successfully.');

console.log('✓ ALL UNIVERSAL UI CUSTOMIZATION VERIFICATION TESTS PASSED SUCCESSFULLY!');
