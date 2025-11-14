/**
 * Example Custom Scheduled Script
 * 
 * This script will be executed based on the schedule configured in the admin panel.
 * You can create your own scripts following this template.
 */

export async function execute() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`🤖 [Custom Script] Example script executed at: ${timestamp}`);
    
    // Example: Log some data
    console.log(`📊 [Custom Script] Example data:`, {
      message: 'This is an example custom scheduled script',
      executionTime: timestamp,
      status: 'success'
    });
    
    // You can add your custom logic here
    // For example:
    // - Database operations
    // - API calls
    // - File operations
    // - Data processing
    // - Cleanup tasks
    // - Notifications
    
    return {
      success: true,
      message: 'Example script executed successfully',
      timestamp
    };
  } catch (error) {
    console.error(`❌ [Custom Script] Error:`, error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
