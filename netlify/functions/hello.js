// Netlify Function example
exports.handler = async (event, context) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    }

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      }
    }

    // Get request data
    const { httpMethod, path, queryStringParameters, body } = event

    // Response data
    const responseData = {
      message: 'Hello from Netlify Function!',
      method: httpMethod,
      path,
      query: queryStringParameters,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    }
  }
}
