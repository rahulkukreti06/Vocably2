function doPost(e) {
  try {
    // Log the incoming request for debugging
    console.log('Incoming request:', JSON.stringify(e, null, 2));
    
    // Check if postData exists
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No data received in the request');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Log the parsed data
    console.log('Parsed data:', JSON.stringify(data, null, 2));
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Email', 'Name', 'Provider', 'Timestamp']);
    }
    
    // Add user data
    sheet.appendRow([
      data.email || '',
      data.name || '',
      data.provider || 'unknown',
      data.timestamp || new Date().toISOString()
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Data saved successfully',
        data: data
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log the error
    console.error('Error in doPost:', error.toString());
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'info',
      message: 'This is a webhook for Vocably sign-ins',
      instructions: 'Send a POST request with user data in JSON format',
      example: {
        email: 'user@example.com',
        name: 'User Name',
        provider: 'google'
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
