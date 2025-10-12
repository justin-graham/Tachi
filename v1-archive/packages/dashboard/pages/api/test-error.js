export default function handler(req, res) {
  try {
    // Test error for Sentry monitoring
    throw new Error('Test error for Sentry monitoring - this is intentional for testing');
  } catch (error) {
    console.error('Test error captured:', error);
    res.status(500).json({
      error: 'Test error thrown',
      message: error.message,
      timestamp: new Date().toISOString(),
      sentry_captured: true
    });
  }
}
