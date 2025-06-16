const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testApi() {
  try {
    // Read test files
    const resumeText = fs.readFileSync(path.join(__dirname, 'test-resume.txt'), 'utf-8');
    const jobText = fs.readFileSync(path.join(__dirname, 'test-job.txt'), 'utf-8');

    // Create form data
    const formData = new FormData();
    formData.append('resume', Buffer.from(resumeText), {
      filename: 'resume.txt',
      contentType: 'text/plain',
    });
    formData.append('jobPosting', jobText);

    // Make API request (use port 3001)
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('Analysis Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApi(); 