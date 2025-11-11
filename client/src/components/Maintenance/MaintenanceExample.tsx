import Maintenance from './Maintenance';

/**
 * Example usage of the Maintenance component
 * 
 * To enable maintenance mode in your app:
 * 1. Import the Maintenance component
 * 2. Replace your main app content with <Maintenance />
 * 3. Optionally pass estimatedTime and reason props
 * 
 * Example in App.tsx:
 * 
 * import Maintenance from './components/Maintenance/Maintenance';
 * 
 * function App() {
 *   const isMaintenanceMode = true; // Set this based on your backend config
 * 
 *   if (isMaintenanceMode) {
 *     return <Maintenance 
 *       estimatedTime="2 hours" 
 *       reason="We're upgrading our servers to serve you better!"
 *     />;
 *   }
 * 
 *   return <YourNormalApp />;
 * }
 */

function MaintenanceExample() {
  return (
    <Maintenance 
      estimatedTime="2 hours"
      reason="We're upgrading our servers to serve you better! Thank you for your patience."
    />
  );
}

export default MaintenanceExample;
